import json
import pickle
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

"""
2,Ariel,7.106,371.0,Released,1988-10-21,0.0,73.0,0.0,tt0094675,fi,Ariel,A Finnish man goes to the city to find a job after the mine where he worked is closed and his father commits suicide.,1.6384,,"Comedy, Drama, Romance, Crime",Villealfa Filmproductions,Finland,suomi,"Kari Helaseppä, Jaakko Talaskivi, Mikko Remes, Merja Pulkkinen, Esko Salminen, Timo Markko, Sami Lanki, Marja Packalén, Tarja Keinänen, Olli Varja, Matti Jaaranen, Heikki Anttila, Markku Rantala, Hannu Viholainen, Tomi Salmela, Kauko Laalo, Esko Nikkari, Hannu Kivisalo, Sirkka Rautiainen, Eetu Hilkamo, Jyrki Olsonen, Heikki Salomaa, Veikko Uusimäki, Turo Pajala, Timo Harakka, Juuso Hirvikangas, Jouko Lumme, Matti Pellonpää, Sakari Kuosmanen, Pentti Auer, Reijo Marin, Timo Toikka, Jorma Markkula, Mikko Lyytikäinen, Hanna Jokinen, Eino Kuusela, Pekka Wilen, Susanna Haavisto, Erkki Pajala",Aki Kaurismäki,Timo Salminen,Aki Kaurismäki,Aki Kaurismäki,,7.4,9780.0,/ojDg0PGvs6R9xYFodRct2kdI6wC.jpg
"""

CAST_LIMIT = 15
SCRIPT_DIR = Path(__file__).parent

# 1. Load the reduced dataset and combine the movie row fields into a single
#    value. The cast field is limited to prevent excess noise.
df = pd.read_csv(SCRIPT_DIR.parent / "dataset" / "TMDB_reduced.csv")
df["cast"] = df["cast"].apply(
    lambda v: ", ".join(str(v).split(", ")[:CAST_LIMIT]) if pd.notna(v) else ""
)
text_cols = [
    "genres",
    "cast",
    "overview",
    "director",
    "tagline",
    "writers",
    "music_composer",
]
df["text"] = df[text_cols].fillna("").agg(" ".join, axis=1)

# 2. TF-IDF — convert each movie's text into a vector of word scores. Words that
#    appear often in one movie but rarely across all movies score higher.
vectorizer = TfidfVectorizer(max_features=15000, stop_words="english")
tfidf_matrix = vectorizer.fit_transform(df["text"])  # sparse (n_movies x 5000)

# 3. TruncatedSVD (LSA) — works on the sparse matrix directly, no .toarray() needed
svd = TruncatedSVD(n_components=200)
vectors = svd.fit_transform(tfidf_matrix)

# 4. L2-normalize so cosine similarity == dot product downstream
vectors = normalize(vectors)

out = SCRIPT_DIR.parent.parent / "runtime" / "model"
out.mkdir(exist_ok=True)

# 5. Serialize — binary float32 for fast loading, IDs as a sidecar JSON
vectors.astype(np.float32).tofile(out / "movie_vectors.bin")
ids = [int(df["id"].iloc[i]) for i in range(len(df))]

with open(out / "movie_ids.json", "w") as f:
    json.dump(ids, f)

metadata = {
    "n_components": svd.n_components,
    "n_features": len(vectorizer.vocabulary_),
    "n_movies": len(df),
}

with open(out / "metadata.json", "w") as f:
    json.dump(metadata, f)

# 6. Pickle fitted sklearn objects for use by the Python server
with open(out / "vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

with open(out / "svd.pkl", "wb") as f:
    pickle.dump(svd, f)
