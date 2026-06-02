import json
import pickle
import numpy as np
from pathlib import Path
from sklearn.preprocessing import normalize

MODEL_DIR = Path(__file__).parent / "./model"

with open(MODEL_DIR / "metadata.json") as f:
    meta = json.load(f)

movie_ids = json.loads((MODEL_DIR / "movie_ids.json").read_text())
id_to_index = {id: i for i, id in enumerate(movie_ids)}

movie_matrix = np.fromfile(MODEL_DIR / "movie_vectors.bin", dtype=np.float32).reshape(
    meta["n_movies"], meta["n_components"]
)
with open(MODEL_DIR / "movie_ratings.json") as f:
    movie_ratings = {int(k): v for k, v in json.load(f).items()}

with open(MODEL_DIR / "vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

with open(MODEL_DIR / "svd.pkl", "rb") as f:
    svd = pickle.load(f)


def get_vector(movie_id):
    idx = id_to_index.get(movie_id)
    return movie_matrix[idx] if idx is not None else None


def get_rating(movie_id):
    return movie_ratings.get(movie_id)


def build_movie_text(details, credits):
    crew = credits.get("crew", [])
    cast = credits.get("cast", [])

    def token(name):
        return name.replace(" ", "_")

    fields = {
        "genres": " ".join(token(genre["name"]) for genre in details.get("genres", [])),
        "cast": " ".join(token(member["name"]) for member in cast),
        "overview": details.get("overview", ""),
        "director": token(
            next(
                (member["name"] for member in crew if member.get("job") == "Director"),
                "",
            )
        ),
        "writers": " ".join(
            token(member["name"])
            for member in crew
            if member.get("department") == "Writing"
        ),
    }

    return " ".join(fields.values())


def compute_text_vector(text):
    tfidf = vectorizer.transform([text])
    vector = svd.transform(tfidf)

    return normalize(vector)[0]



def most_similar(vec, candidate_vectors):
    return int(np.argmax([np.dot(vec, c) for c in candidate_vectors]))


def compute_pref_vector(liked_vectors, disliked_vectors):
    pref = np.mean(liked_vectors, axis=0)

    if disliked_vectors:
        pref -= np.mean(disliked_vectors, axis=0) * 0.5

    norm = np.linalg.norm(pref)
    return pref / norm if norm > 0 else pref


def recommend(pref):
    return movie_matrix @ pref


def top_terms(pref, n=15):
    tfidf_vec = svd.inverse_transform(pref.reshape(1, -1))[0]
    feature_names = vectorizer.get_feature_names_out()
    top_indices = np.argsort(tfidf_vec)[-n:][::-1]

    return [feature_names[i] for i in top_indices]
