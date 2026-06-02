import json
import pickle
import numpy as np
from pathlib import Path
from sklearn.preprocessing import normalize

CAST_LIMIT = 15
MODEL_DIR = Path(__file__).parent / "./model"

with open(MODEL_DIR / "metadata.json") as f:
    meta = json.load(f)

movie_ids = json.loads((MODEL_DIR / "movie_ids.json").read_text())
id_to_index = {id: i for i, id in enumerate(movie_ids)}

movie_matrix = np.fromfile(MODEL_DIR / "movie_vectors.bin", dtype=np.float32).reshape(
    meta["n_movies"], meta["n_components"]
)

with open(MODEL_DIR / "vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

with open(MODEL_DIR / "svd.pkl", "rb") as f:
    svd = pickle.load(f)


def get_vector(movie_id):
    idx = id_to_index.get(movie_id)
    return movie_matrix[idx] if idx is not None else None


def build_movie_text(details, credits):
    crew = credits.get("crew", [])
    cast = credits.get("cast", [])

    fields = {
        "genres": " ".join(genre["name"] for genre in details.get("genres", [])),
        "cast": " ".join(member["name"] for member in cast[:CAST_LIMIT]),
        "overview": details.get("overview", ""),
        "director": next(
            (member["name"] for member in crew if member.get("job") == "Director"), ""
        ),
        "tagline": details.get("tagline", ""),
        "writers": " ".join(
            member["name"] for member in crew if member.get("department") == "Writing"
        ),
        "music_composer": " ".join(
            member["name"]
            for member in crew
            if member.get("job") == "Original Music Composer"
        ),
    }
    return " ".join(fields.values())


def compute_vector(text):
    tfidf = vectorizer.transform([text])
    vector = svd.transform(tfidf)
    return normalize(vector)[0]


def recommend(liked_vectors, disliked_vectors):
    if not liked_vectors:
        return None

    pref = np.mean(liked_vectors, axis=0)

    if disliked_vectors:
        pref -= np.mean(disliked_vectors, axis=0) * 0.5

    norm = np.linalg.norm(pref)
    pref = pref / norm if norm > 0 else pref

    return movie_matrix @ pref
