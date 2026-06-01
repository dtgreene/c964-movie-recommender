import json
import pickle
import numpy as np
from pathlib import Path
from sklearn.preprocessing import normalize

MODEL_DIR = Path(__file__).parent / '../model'

with open(MODEL_DIR / 'metadata.json') as f:
    meta = json.load(f)

movie_ids = json.loads((MODEL_DIR / 'movie_ids.json').read_text())
id_to_index = {id: i for i, id in enumerate(movie_ids)}

movie_matrix = np.fromfile(MODEL_DIR / 'movie_vectors.bin', dtype=np.float32).reshape(
    meta['n_movies'], meta['n_components']
)

with open(MODEL_DIR / 'vectorizer.pkl', 'rb') as f:
    vectorizer = pickle.load(f)
with open(MODEL_DIR / 'svd.pkl', 'rb') as f:
    svd = pickle.load(f)


def get_vector(movie_id):
    idx = id_to_index.get(movie_id)
    return movie_matrix[idx] if idx is not None else None


def build_movie_text(details, credits):
    genres = ' '.join(g['name'] for g in details.get('genres', []))
    cast = ' '.join(c['name'] for c in credits.get('cast', [])[:10])
    crew = credits.get('crew', [])
    director = next((c['name'] for c in crew if c.get('job') == 'Director'), '')
    writers = ' '.join(c['name'] for c in crew if c.get('department') == 'Writing')
    return ' '.join([genres, cast, details.get('overview', ''), director, details.get('tagline', ''), writers])


def compute_vector(text):
    tfidf = vectorizer.transform([text])
    vector = svd.transform(tfidf)
    return normalize(vector)[0]


def recommend(liked_ids, disliked_ids, top_n=20):
    liked_vectors = [v for id in liked_ids if (v := get_vector(id)) is not None]
    disliked_vectors = [v for id in disliked_ids if (v := get_vector(id)) is not None]

    if not liked_vectors:
        return []

    pref = np.mean(liked_vectors, axis=0)
    if disliked_vectors:
        pref -= np.mean(disliked_vectors, axis=0) * 0.5
    norm = np.linalg.norm(pref)
    pref = pref / norm if norm > 0 else pref

    scores = movie_matrix @ pref
    excluded = set(liked_ids) | set(disliked_ids)

    results = sorted(
        ((movie_ids[i], float(scores[i])) for i in range(len(movie_ids)) if movie_ids[i] not in excluded),
        key=lambda x: -x[1],
    )
    return [id for id, _ in results[:top_n]]
