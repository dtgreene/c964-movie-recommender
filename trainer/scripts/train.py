import ast
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

"""
id
title
vote_average
vote_count
status
release_date
revenue
runtime
budget
imdb_id
original_language
original_title
overview
popularity
tagline
genres
production_companies
production_countries
spoken_languages
cast
director
director_of_photography
writers
producers
music_composer
imdb_rating
imdb_votes
poster_path
"""

def extract_names(value, limit=None):
    """Pull 'name' fields out of a TMDB JSON column (e.g. genres, cast)."""
    if pd.isna(value):
        return ""
    try:
        items = ast.literal_eval(value)
        names = [item["name"] for item in items if "name" in item]
        if limit:
            names = names[:limit]
        return " ".join(names)
    except (ValueError, SyntaxError, TypeError):
        return str(value)


# 1. Load the reduced dataset
df = pd.read_csv("dataset/TMDB_reduced.csv")
df["genres_text"] = df["genres"].apply(extract_names)
df["cast_text"] = df["cast"].apply(lambda v: extract_names(v, limit=10))
df["text"] = (
    df["genres_text"] + " " +
    df["cast_text"] + " " +
    df["overview"].fillna("") + " " +
    df["director"].fillna("") + " " +
    df["tagline"].fillna("") + " " +
    df["writers"].fillna("")
)

# 2. TF-IDF
vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
tfidf_matrix = vectorizer.fit_transform(df["text"])  # sparse (n_movies x 5000)

# 3. TruncatedSVD (LSA) — works on the sparse matrix directly, no .toarray() needed
svd = TruncatedSVD(n_components=100)
vectors = svd.fit_transform(tfidf_matrix)

# 4. L2-normalize so cosine similarity == dot product downstream
vectors = normalize(vectors)

out = Path("../runtime/server/model")
out.mkdir(exist_ok=True)

# 5. Serialize — binary float32 for fast loading, IDs as a sidecar JSON
vectors.astype(np.float32).tofile(out / "movie_vectors.bin")
ids = [int(df["id"].iloc[i]) for i in range(len(df))]
with open(out / "movie_ids.json", "w") as f:
    json.dump(ids, f)

# 6. Export transform artifacts for runtime vector computation
# Vocabulary must be JSON since keys are strings; weights and components are binary float32
with open(out / "vocabulary.json", "w") as f:
    json.dump({k: int(v) for k, v in vectorizer.vocabulary_.items()}, f)

vectorizer.idf_.astype(np.float32).tofile(out / "idf_weights.bin")

# Shape: (n_components x n_features) = (100 x 5000), row-major
svd.components_.astype(np.float32).tofile(out / "svd_components.bin")
