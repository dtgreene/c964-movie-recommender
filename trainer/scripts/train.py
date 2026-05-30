import ast
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

"""
5,Four Rooms,5.9,2828.0,Released,1995-12-09,4257354.0,98.0,4000000.0,tt0113101,en,Four Rooms,It's Ted the Bellhop's first night on the job...and the hotel's very unusual guests are about to place him in some outrageous predicaments. It seems that this evening's room service is serving up one unbelievable happening after another.,3.4324,"Twelve outrageous guests. Four scandalous requests. And one lone bellhop, in his first day on the job, who's in for the wildest New year's Eve of his life.",Comedy,"Miramax, A Band Apart",United States of America,English,"Tamlyn Tomita, Lana McKissack, Quinn Hellerman, Ione Skye, Quentin Tarantino, Antonio Banderas, Salma Hayek Pinault, Sammi Davis, Laura Rush, Madonna, Jennifer Beals, Amanda de Cadenet, Paul Skemp, Paul Calderon, David Proval, Kathy Griffin, Marisa Tomei, Marc Lawrence, Lawrence Bender, Alicia Witt, Bruce Willis, Valeria Golino, Tim Roth, Danny Verduzco, Patricia Vonne, Unruly Julie McClean, Kimberly Blair, Lili Taylor","Quentin Tarantino, Allison Anders, Robert Rodriguez, Alexandre Rockwell","Phil Parmet, Guillermo Navarro, Rodrigo García, Andrzej Sekula","Quentin Tarantino, Allison Anders, Robert Rodriguez, Alexandre Rockwell","Quentin Tarantino, Lawrence Bender, Alexandre Rockwell",Combustible Edison,6.7,117016.0,/75aHn1NOYXh4M7L5shoeQ6NGykP.jpg
"""

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

# 6. Save fitted models for transforming new movies later
joblib.dump(vectorizer, out / "tfidf.joblib")
joblib.dump(svd, out / "svd.joblib")
