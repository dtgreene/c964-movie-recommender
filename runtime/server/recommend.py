import asyncio
import json
import logging
import pickle
import time
import numpy as np
from pathlib import Path
from sklearn.preprocessing import normalize

from tmdb import tmdb_get

MODEL_DIR = Path(__file__).parent / "./model"
RECOMMENDATION_SIZE = 10

with open(MODEL_DIR / "metadata.json") as f:
    meta = json.load(f)

with open(MODEL_DIR / "movie_meta.json") as f:
    _meta_file = json.load(f)

_movie_ids = _meta_file["ids"]
_id_to_index = {id: i for i, id in enumerate(_movie_ids)}
_movie_data = {int(k): v for k, v in _meta_file["movies"].items()}
_movie_matrix = np.fromfile(MODEL_DIR / "movie_vectors.bin", dtype=np.float32).reshape(
    meta["n_movies"], meta["n_components"]
)

with open(MODEL_DIR / "vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

with open(MODEL_DIR / "svd.pkl", "rb") as f:
    svd = pickle.load(f)

MIN_POOL_SIZE = 200
MAX_POOL_SIZE = 500


def _get_vector(movie_id):
    idx = _id_to_index.get(movie_id)
    return _movie_matrix[idx] if idx is not None else None


def _get_rating(movie_id):
    m = _movie_data.get(movie_id)
    return m["rating"] if m else None


def _get_popularity(movie_id):
    m = _movie_data.get(movie_id)
    return m["popularity"] if m else None


def _get_ratings_count(movie_id):
    m = _movie_data.get(movie_id)
    return m["ratings_count"] if m else None


def _get_year(movie_id):
    m = _movie_data.get(movie_id)
    return m.get("year") if m else None


def _get_language(movie_id):
    m = _movie_data.get(movie_id)
    return m.get("language") if m else None


def _token(name):
    return name.replace(" ", "_")


def _build_movie_text(details, credits):
    crew = credits.get("crew", [])
    cast = credits.get("cast", [])

    director = next((m["name"] for m in crew if m.get("job") == "Director"), None)
    parts = [
        " ".join(_token(g["name"]) for g in details.get("genres", [])),
        " ".join(_token(m["name"]) for m in cast),
        _token(director) if director else "",
        " ".join(_token(m["name"]) for m in crew if m.get("department") == "Writing"),
        details.get("tagline", ""),
        details.get("overview", ""),
    ]

    return " ".join(filter(None, parts))


async def _resolve_vector(id):
    # Try and lookup the vector from the list produced by the training data
    vector = _get_vector(id)

    if vector is not None:
        return vector

    # Since this movie was not in the training data, we need to fetch the
    # details from TMDb to create the text representation.
    [details, credits] = await asyncio.gather(
        tmdb_get(f"/3/movie/{id}"),
        tmdb_get(f"/3/movie/{id}/credits"),
    )
    # Important that we build this exactly how the trainer builds the main
    # dataset. Same columns, transformations, etc.
    text = _build_movie_text(details, credits)

    # Compute this movies vector through the pickled TFIDF and SVD files
    # produced during the training step.
    tfidf = vectorizer.transform([text])
    vector = svd.transform(tfidf)
    vector = normalize(vector)

    # Extract the first element since this set of vectors only contains one row.
    return vector[0]


def _most_similar(vec, candidate_vectors):
    return int(np.argmax([np.dot(vec, c) for c in candidate_vectors]))


def _compute_pref_vector(liked_vectors, disliked_vectors, dislike_weight):
    pref = np.mean(liked_vectors, axis=0)

    if disliked_vectors:
        pref -= np.mean(disliked_vectors, axis=0) * dislike_weight

    norm = np.linalg.norm(pref)
    return pref / norm if norm > 0 else pref


def _normalize_range(vals):
    lo, hi = min(vals), max(vals)
    return lo, hi - lo or 1.0


def _rank_weighted(candidates, imdb_weight, popular_weight):
    min_s, span_s = _normalize_range([s for _, s in candidates])
    min_i, span_i = _normalize_range([_get_rating(id) or 0 for id, _ in candidates])
    min_p, span_p = _normalize_range([_get_popularity(id) or 0 for id, _ in candidates])

    return sorted(
        candidates,
        reverse=True,
        key=lambda x: (
            (x[1] - min_s) / span_s
            + imdb_weight * ((_get_rating(x[0]) or 0) - min_i) / span_i
            + popular_weight * ((_get_popularity(x[0]) or 0) - min_p) / span_p
        ),
    )


def _rank(
    liked_vectors,
    disliked_vectors,
    excluded,
    imdb_weight,
    popular_weight,
    pool_size,
    dislike_weight,
    min_year,
    languages,
):
    pref = _compute_pref_vector(liked_vectors, disliked_vectors, dislike_weight)
    scores = _movie_matrix @ pref
    pool = int(MIN_POOL_SIZE + pool_size * (MAX_POOL_SIZE - MIN_POOL_SIZE))
    candidates = sorted(
        (
            (_movie_ids[i], float(scores[i]))
            for i in range(len(_movie_ids))
            if _movie_ids[i] not in excluded
            and (min_year is None or (_get_year(_movie_ids[i]) or 0) >= min_year)
            and (not languages or _get_language(_movie_ids[i]) in languages)
        ),
        key=lambda x: -x[1],
    )[:pool]

    if imdb_weight > 0 or popular_weight > 0:
        candidates = _rank_weighted(candidates, imdb_weight, popular_weight)

    return candidates[:RECOMMENDATION_SIZE]


def _infer_top_terms(pref, n=15):
    tfidf_vec = svd.inverse_transform(pref.reshape(1, -1))[0]
    feature_names = vectorizer.get_feature_names_out()
    top_indices = np.argsort(tfidf_vec)[-n:][::-1]
    top_vals = tfidf_vec[top_indices]
    total = top_vals.sum() or 1.0

    return [
        {"term": feature_names[i], "score": round(float(v / total * 100), 1)}
        for i, v in zip(top_indices, top_vals)
    ]


async def get_taste(liked_ids):
    vectors = await asyncio.gather(*[_resolve_vector(id) for id in liked_ids])
    pref = np.mean(vectors, axis=0)
    norm = np.linalg.norm(pref)
    pref = pref / norm if norm > 0 else pref
    return {"top_terms": _infer_top_terms(pref)}


async def get_recommendations(
    liked_ids,
    disliked_ids,
    imdb_weight=0.0,
    popular_weight=0.0,
    pool_size=0.0,
    dislike_weight=0.0,
    min_year=None,
    languages=None,
):
    all_ids = list(dict.fromkeys([*liked_ids, *disliked_ids]))
    all_vectors = dict(
        zip(all_ids, await asyncio.gather(*[_resolve_vector(id) for id in all_ids]))
    )

    liked_vectors = [all_vectors[id] for id in liked_ids]
    disliked_vectors = [all_vectors[id] for id in disliked_ids]
    excluded = set(liked_ids) | set(disliked_ids)

    t0 = time.perf_counter()
    top = _rank(
        liked_vectors,
        disliked_vectors,
        excluded,
        imdb_weight,
        popular_weight,
        pool_size,
        dislike_weight,
        min_year,
        languages,
    )
    logging.getLogger("uvicorn.error").info(
        "Recommendation rank completed in %.1f ms", (time.perf_counter() - t0) * 1000
    )

    rec_vectors = [_get_vector(id) for id, _ in top]
    movies = await asyncio.gather(*[tmdb_get(f"/3/movie/{id}") for id, _ in top])
    results = [
        {
            "_similar_to": liked_ids[_most_similar(rec_vec, liked_vectors)],
            "_imdb_rating": _get_rating(id),
            "_imdb_rating_count": _get_ratings_count(id),
            **movie,
        }
        for movie, (id, score), rec_vec in zip(movies, top, rec_vectors)
    ]

    return results
