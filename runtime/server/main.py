import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

from recommend import (
    compute_pref_vector,
    recommend,
    get_vector,
    get_rating,
    get_popularity,
    compute_text_vector,
    build_movie_text,
    movie_ids,
    most_similar,
    top_terms,
)

load_dotenv()

# https://developer.themoviedb.org/reference/getting-started

TMDB_BASE = "https://api.themoviedb.org"
TMDB_HEADERS = {
    "Authorization": f"Bearer {os.environ['TMDB_READ_ACCESS_TOKEN']}",
    "Accept": "application/json",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(base_url=TMDB_BASE, headers=TMDB_HEADERS) as client:
        app.state.tmdb = client
        yield


app = FastAPI(lifespan=lifespan)


def normalize_range(vals):
    lo, hi = min(vals), max(vals)
    return lo, hi - lo or 1.0


def rank_weighted(ranked, imdb_weight, popular_weight):
    min_s, span_s = normalize_range([s for _, s in ranked])
    min_i, span_i = normalize_range([get_rating(id) or 0 for id, _ in ranked])
    min_p, span_p = normalize_range([get_popularity(id) or 0 for id, _ in ranked])

    return sorted(
        ranked,
        reverse=True,
        key=lambda x: (
            (x[1] - min_s) / span_s
            + imdb_weight * ((get_rating(x[0]) or 0) - min_i) / span_i
            + popular_weight * ((get_popularity(x[0]) or 0) - min_p) / span_p
        ),
    )


async def tmdb_get(path, params=None):
    response = await app.state.tmdb.get(
        path, params={"language": "en-US", **(params or {})}
    )
    response.raise_for_status()
    return response.json()


@app.get("/api/search")
async def search(query: str, page: int = 1):
    return await tmdb_get("/3/search/movie", {"query": query, "page": page})


@app.get("/api/top_rated")
async def top_rated(page: int = 1):
    return await tmdb_get("/3/movie/top_rated", {"page": page})


@app.get("/api/trending")
async def trending(page: int = 1):
    return await tmdb_get("/3/movie/popular", {"page": page})


@app.get("/api/movie/{movie_id}")
async def movie(movie_id: int):
    return await tmdb_get(f"/3/movie/{movie_id}")


async def resolve_vector(id):
    # Try and lookup the vector from the list produced by the training data
    vector = get_vector(id)

    if vector is not None:
        return vector

    # Since this movie wasnt in the training data, we need to fetch the details
    # to create the text representation + vector.
    [details, credits] = await asyncio.gather(
        tmdb_get(f"/3/movie/{id}"),
        tmdb_get(f"/3/movie/{id}/credits"),
    )
    text = build_movie_text(details, credits)
    return compute_text_vector(text)


@app.get("/api/recommendations")
async def recommendations(
    liked: list[int] = Query(default=[]),
    disliked: list[int] = Query(default=[]),
    imdb_vote_weight: float = Query(default=0.0, ge=0.0, le=1.0),
    tmdb_popular_weight: float = Query(default=0.0, ge=0.0, le=1.0),
):
    if len(liked) < 5:
        raise HTTPException(
            status_code=400,
            detail="At least 5 liked movies are required.",
        )

    all_ids = list(dict.fromkeys([*liked, *disliked]))
    all_vectors = dict(
        zip(all_ids, await asyncio.gather(*[resolve_vector(id) for id in all_ids]))
    )

    liked_vectors = [all_vectors[id] for id in liked]
    disliked_vectors = [all_vectors[id] for id in disliked]
    pref = compute_pref_vector(liked_vectors, disliked_vectors)

    scores = recommend(pref)
    excluded = set(liked) | set(disliked)
    ranked = sorted(
        (
            (movie_ids[i], float(scores[i]))
            for i in range(len(movie_ids))
            if movie_ids[i] not in excluded
        ),
        key=lambda x: -x[1],
    )[:200]

    if imdb_vote_weight > 0 or tmdb_popular_weight > 0:
        ranked = rank_weighted(ranked, imdb_vote_weight, tmdb_popular_weight)

    top = ranked[:10]
    rec_vectors = [get_vector(id) for id, _ in top]
    movies = await asyncio.gather(*[tmdb_get(f"/3/movie/{id}") for id, _ in top])
    results = [
        {
            "_rec_score": score,
            "_rec_similar_to": liked[most_similar(rec_vec, liked_vectors)],
            "_imdb_rating": get_rating(id),
            **movie,
        }
        for movie, (id, score), rec_vec in zip(movies, top, rec_vectors)
    ]

    return {"_rec_terms": top_terms(pref), "results": results}


app.mount(
    "/",
    StaticFiles(directory=str(Path(__file__).parent / "public"), html=True),
    name="static",
)
