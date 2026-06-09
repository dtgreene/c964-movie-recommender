import json
import random
import numpy as np
from pathlib import Path
from collections import defaultdict

MODEL_DIR = Path(__file__).parent.parent / "runtime" / "server" / "model"

SEEDS_PER_GENRE = 5
TOP_K = 10
RANDOM_SEED = 42

random.seed(RANDOM_SEED)

with open(MODEL_DIR / "metadata.json") as f:
    meta = json.load(f)

with open(MODEL_DIR / "movie_meta.json") as f:
    movie_meta = json.load(f)

movie_ids = movie_meta["ids"]
movies = movie_meta["movies"]
id_to_index = {id: i for i, id in enumerate(movie_ids)}

movie_matrix = np.fromfile(MODEL_DIR / "movie_vectors.bin", dtype=np.float32).reshape(
    meta["n_movies"], meta["n_components"]
)

genre_to_ids: dict[str, list[int]] = defaultdict(list)
for movie_id, data in movies.items():
    mid = int(movie_id)
    if mid not in id_to_index:
        continue
    for genre in data.get("genres", []):
        genre_to_ids[genre].append(mid)

id_to_genres: dict[int, set[str]] = defaultdict(set)
for genre, ids in genre_to_ids.items():
    for mid in ids:
        id_to_genres[mid].add(genre)

print(f"Found {len(genre_to_ids)} genres across {len(movie_ids)} movies.\n")


def rank(seed_vectors, excluded):
    pref = np.mean(seed_vectors, axis=0)
    pref /= np.linalg.norm(pref)
    scores = movie_matrix @ pref

    return sorted(
        (movie_ids[i] for i in range(len(movie_ids)) if movie_ids[i] not in excluded),
        key=lambda mid: -float(scores[id_to_index[mid]]),
    )[:TOP_K]


def genre_coherence(genre, seeds):
    seed_vectors = [movie_matrix[id_to_index[mid]] for mid in seeds]
    recs = rank(seed_vectors, excluded=set(seeds))
    matches = sum(1 for mid in recs if genre in id_to_genres[mid])

    return matches / len(recs)


print(f"{'Genre':<25} {'Pool':>6}  {'Seeds':>5}  {'Coherence':>10}")
print("-" * 52)

results = []

for genre, ids in sorted(genre_to_ids.items(), key=lambda x: -len(x[1])):
    if len(ids) < SEEDS_PER_GENRE + TOP_K:
        continue

    seeds = random.sample(ids, SEEDS_PER_GENRE)
    score = genre_coherence(genre, seeds)
    results.append((genre, len(ids), score))
    print(f"{genre:<25} {len(ids):>6}  {SEEDS_PER_GENRE:>5}  {score:>9.1%}")

if results:
    avg = sum(s for _, _, s in results) / len(results)
    print("-" * 52)
    print(f"{'Average':<25} {'':>6}  {'':>5}  {avg:>9.1%}")
