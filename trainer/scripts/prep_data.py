import pandas as pd
from pathlib import Path

data_dir = Path(__file__).parent.parent / "data"

df = pd.read_csv(data_dir / "TMDB_all_movies.csv")
total_records = len(df)

filtered = df[
    (df["status"] == "Released") &
    (df["imdb_id"].notna()) &
    (pd.to_numeric(df["imdb_votes"], errors="coerce") > 100) &
    (pd.to_numeric(df["runtime"], errors="coerce") > 45) &
    (df["overview"].notna())
]

print(f"Original record count: {total_records}")
print(f"Final record count: {len(filtered)}")

filtered.to_csv(data_dir / "TMDB_reduced.csv", index=False)