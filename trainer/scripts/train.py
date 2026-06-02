import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

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
df = prepare(SCRIPT_DIR.parent / "dataset")
print("Dataset prep complete.")

print("Begin training...")

text_cols = ["genres", "cast", "overview", "director", "writers"]
df["text"] = df[text_cols].fillna("").agg(" ".join, axis=1)
print(f"  Loaded {len(df)} movies.")

print("  Fitting TF-IDF vectorizer...")
vectorizer = TfidfVectorizer(
    max_features=TFIDF_MAX_FEATURES, stop_words="english", max_df=TFIDF_MAX_DF
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

out = SCRIPT_DIR.parent.parent / "runtime" / "server" / "model"
out.mkdir(exist_ok=True)

vectors.astype(np.float32).tofile(out / "movie_vectors.bin")
ratings = {
    int(id): round(float(r), 1)
    for id, r in zip(df["id"], df["imdb_rating"])
    if pd.notna(r)
}
with open(out / "movie_ratings.json", "w") as f:
    json.dump(ratings, f)
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

with open(out / "vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

with open(out / "svd.pkl", "wb") as f:
    pickle.dump(svd, f)

print("Training complete.")
