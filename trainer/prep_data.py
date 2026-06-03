import runpy
import pandas as pd
from pathlib import Path

MIN_IMDB_VOTE_COUNT = 500
MIN_IMDB_RATING = 5.0
MIN_RUNTIME_MINUTES = 45
MIN_TMDB_VOTE_COUNT = 10


def _join_tokens(value):
    if pd.isna(value):
        return ""

    tokens = (part.strip().replace(" ", "_") for part in str(value).split(","))

    return " ".join(t for t in tokens if t)


def prepare(data_dir):
    all_movies = data_dir / "TMDB_all_movies.csv"

    if not all_movies.exists():
        runpy.run_path(str(Path(__file__).parent / "download.py"))
    else:
        print("  Dataset found; skipping download.")

    print("  Loading dataset...")
    df = pd.read_csv(all_movies)
    total_records = len(df)
    print(f"  Loaded {total_records} records.")

    print("  Filtering...")
    filtered = df[
        (df["status"] == "Released")
        & (df["imdb_id"].notna())
        & (pd.to_numeric(df["imdb_votes"], errors="coerce") > MIN_IMDB_VOTE_COUNT)
        & (pd.to_numeric(df["imdb_rating"], errors="coerce") >= MIN_IMDB_RATING)
        & (pd.to_numeric(df["runtime"], errors="coerce") > MIN_RUNTIME_MINUTES)
        & (df["overview"].notna())
        & (pd.to_numeric(df["vote_count"], errors="coerce") > MIN_TMDB_VOTE_COUNT)
    ]
    print(
        f"  {len(filtered)} records remaining ({total_records - len(filtered)} removed)."
    )

    print("  Tokenizing name fields...")
    filtered = filtered.copy()
    split_cols = [
        "genres",
        "cast",
        "director",
        "writers",
    ]
    for col in split_cols:
        filtered[col] = filtered[col].apply(_join_tokens)

    return filtered
