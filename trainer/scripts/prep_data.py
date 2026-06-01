import runpy
import pandas as pd
from pathlib import Path

MIN_IMDB_VOTE_COUNT = 100
MIN_RUNTIME_MINUTES = 45

data_dir = Path(__file__).parent.parent / "dataset"
all_movies = data_dir / "TMDB_all_movies.csv"

if not all_movies.exists():
    runpy.run_path(str(Path(__file__).parent / "download.py"))

df = pd.read_csv(all_movies)
total_records = len(df)

filtered = df[
    (df["status"] == "Released")
    & (df["imdb_id"].notna())
    & (pd.to_numeric(df["imdb_votes"], errors="coerce") > MIN_IMDB_VOTE_COUNT)
    & (pd.to_numeric(df["runtime"], errors="coerce") > MIN_RUNTIME_MINUTES)
    & (df["overview"].notna())
]

print(f"Original record count: {total_records}")
print(f"Final record count: {len(filtered)}")

filtered.to_csv(data_dir / "TMDB_reduced.csv", index=False)
