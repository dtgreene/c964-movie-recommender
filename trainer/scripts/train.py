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
497,The Green Mile,8.507,19272.0,Released,1999-12-10,286801374.0,189.0,60000000.0,tt0120689,en,The Green Mile,"A supernatural tale set on death row in a Southern prison, where gentle giant John Coffey possesses the mysterious power to heal people's ailments. When the cell block's head guard, Paul Edgecomb, recognizes Coffey's miraculous gift, he tries desperately to help stave off the condemned man's execution.",27.901,Paul Edgecomb didn't believe in miracles. Until the day he met one.,"Fantasy, Drama, Crime","Castle Rock Entertainment, Darkwoods Productions",United States of America,"Français, English","Garth Shaw, Christopher Joel Ives, Phil Hawn, Paula Malcomson, Gower Mills, Bailey Drucker, Van Epperson, Michael Clarke Duncan, Brian Libby, Katelyn Leavenworth, Bonnie Hunt, Brent Briscoe, David E. Browning, William Sadler, Todd Thompson, James Cromwell, Rai Tasco, Harry Dean Stanton, Tommy Barnes, Wes Hall, Jeffrey DeMunn, Rebecca Klingler, Jared Stovall, Patricia Clarkson, Michael Jeter, Evanne Drucker, Edrie Warner, Gary Imhoff, Rachel Singer, Graham Greene, Scotty Leavenworth, Gary Sinise, Sam Rockwell, Eve Brent, Bill Gratton, Barry Pepper, Judy Herrera, David Morse, Doug Hutchison, Dee Croxton, Bill McKinney, Mack Miles, Tom Hanks, Dabbs Greer",Frank Darabont,David Tattersall,"Stephen King, Frank Darabont","Frank Darabont, David Valdes",Thomas Newman,8.6,1563228.0,/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg
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
tfidf_matrix = vectorizer.fit_transform(df["text"])

# 3. TruncatedSVD (LSA)
svd = TruncatedSVD(n_components=200)
vectors = svd.fit_transform(tfidf_matrix)

# 4. L2-normalize so cosine similarity == dot product downstream
vectors = normalize(vectors)

out = SCRIPT_DIR.parent.parent / "runtime" / "server" / "model"
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
