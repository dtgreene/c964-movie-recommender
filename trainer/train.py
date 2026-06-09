import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize
from collections import Counter, defaultdict

from prep_data import prepare

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
497,The Green Mile,8.507,19272.0,Released,1999-12-10,286801374.0,189.0,60000000.0,tt0120689,en,The Green Mile,"A supernatural tale set on death row in a Southern prison, where gentle giant John Coffey possesses the mysterious power to heal people's ailments. When the cell block's head guard, Paul Edgecomb, recognizes Coffey's miraculous gift, he tries desperately to help stave off the condemned man's execution.",27.901,Paul Edgecomb didn't believe in miracles. Until the day he met one.,"Fantasy, Drama, Crime","Castle Rock Entertainment, Darkwoods Productions",United States of America,"Français, English","Garth Shaw, Christopher Joel Ives, Phil Hawn, Paula Malcomson, Gower Mills, Bailey Drucker, Van Epperson, Michael Clarke Duncan, Brian Libby, Katelyn Leavenworth, Bonnie Hunt, Brent Briscoe, David E. Browning, William Sadler, Todd Thompson, James Cromwell, Rai Tasco, Harry Dean Stanton, Tommy Barnes, Wes Hall, Jeffrey DeMunn, Rebecca Klingler, Jared Stovall, Patricia Clarkson, Michael Jeter, Evanne Drucker, Edrie Warner, Gary Imhoff, Rachel Singer, Graham Greene, Scotty Leavenworth, Gary Sinise, Sam Rockwell, Eve Brent, Bill Gratton, Barry Pepper, Judy Herrera, David Morse, Doug Hutchison, Dee Croxton, Bill McKinney, Mack Miles, Tom Hanks, Dabbs Greer",Frank Darabont,David Tattersall,"Stephen King, Frank Darabont","Frank Darabont, David Valdes",Thomas Newman,8.6,1563228.0,/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg
"""

TFIDF_MAX_FEATURES = 15000
TFIDF_MAX_DF = 0.3
SVD_N_COMPONENTS = 300

SCRIPT_DIR = Path(__file__).parent

print("Begin dataset prep...")
df = prepare(SCRIPT_DIR / "dataset")
print("Dataset prep complete.")

print("Begin training...")


text_cols = ["genres", "director", "writers", "tagline", "overview"]
df["text"] = df[text_cols].fillna("").agg(" ".join, axis=1)
print(f"  Loaded {len(df)} movies.")

print("  Fitting TF-IDF vectorizer...")
vectorizer = TfidfVectorizer(
    max_features=TFIDF_MAX_FEATURES,
    stop_words="english",
    max_df=TFIDF_MAX_DF,
    # min_df=TFIDF_MIN_DF,
    # ngram_range=(1, 3),
)
tfidf_matrix = vectorizer.fit_transform(df["text"])
print(
    f"  TF-IDF matrix: {tfidf_matrix.shape[0]} movies x {tfidf_matrix.shape[1]} features."
)

print("  Fitting SVD (LSA)...")
svd = TruncatedSVD(n_components=SVD_N_COMPONENTS)
vectors = svd.fit_transform(tfidf_matrix)
print(f"  Explained variance: {svd.explained_variance_ratio_.sum():.1%}")

print("  Normalizing vectors...")
vectors = normalize(vectors)

out = SCRIPT_DIR.parent / "runtime" / "server" / "model"
out.mkdir(exist_ok=True)

vectors.astype(np.float32).tofile(out / "movie_vectors.bin")
movie_meta = {
    "ids": [int(df["id"].iloc[i]) for i in range(len(df))],
    "movies": {
        str(int(id)): {
            "rating": round(float(r), 1) if pd.notna(r) else None,
            "popularity": round(float(p), 3) if pd.notna(p) else None,
            "ratings_count": int(c) if pd.notna(c) else None,
            "year": int(str(d)[:4]) if pd.notna(d) and len(str(d)) >= 4 else None,
            "language": str(lang) if pd.notna(lang) else None,
            "genres": [g.replace("_", " ") for g in str(g_raw).split()]
            if pd.notna(g_raw)
            else [],
        }
        for id, r, p, c, d, lang, g_raw in zip(
            df["id"],
            df["imdb_rating"],
            df["popularity"],
            df["imdb_votes"],
            df["release_date"],
            df["original_language"],
            df["genres"],
        )
    },
}

with open(out / "movie_meta.json", "w") as f:
    json.dump(movie_meta, f)

metadata = {
    "n_components": svd.n_components,
    "n_features": len(vectorizer.vocabulary_),
    "n_movies": len(df),
}

with open(out / "metadata.json", "w") as f:
    json.dump(metadata, f)

with open(out / "vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

with open(out / "svd.pkl", "wb") as f:
    pickle.dump(svd, f)

print("Computing visuals metadata...")

genre_counts = Counter()
genre_ratings = defaultdict(list)

for _, row in df.iterrows():
    for g in str(row["genres"]).split():
        genre = g.replace("_", " ")
        genre_counts[genre] += 1
        if pd.notna(row["imdb_rating"]):
            genre_ratings[genre].append(float(row["imdb_rating"]))

tfidf_sum = np.asarray(tfidf_matrix.sum(axis=0)).flatten()
feature_names = vectorizer.get_feature_names_out()
top_indices = np.argsort(tfidf_sum)[-20:][::-1]
top_tfidf_terms = [
    {"term": feature_names[i], "score": round(float(tfidf_sum[i]), 2)}
    for i in top_indices
]

visuals_meta = {
    "genre_distribution": [
        {"genre": g, "count": c}
        for g, c in sorted(genre_counts.items(), key=lambda x: -x[1])
    ],
    "rating_distribution": [
        {"rating": r, "count": c}
        for r, c in sorted(
            Counter(round(float(x) * 2) / 2 for x in df["imdb_rating"].dropna()).items()
        )
    ],
    "avg_rating_by_genre": [
        {"genre": g, "avg_rating": round(sum(rs) / len(rs), 2)}
        for g, rs in sorted(
            genre_ratings.items(), key=lambda x: -(sum(x[1]) / len(x[1]))
        )
    ],
    "top_tfidf_terms": top_tfidf_terms,
}

with open(out / "visuals_meta.json", "w") as f:
    json.dump(visuals_meta, f)

print("Training complete.")
