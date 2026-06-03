import httpx
import zipfile
from io import BytesIO
from pathlib import Path

DATASET_URL = "https://www.kaggle.com/api/v1/datasets/download/alanvourch/tmdb-movies-daily-updates"
OUT_DIR = Path(__file__).parent / "dataset"

OUT_DIR.mkdir(exist_ok=True)

print("Begin download...")
print("  Downloading dataset...")
with httpx.Client(follow_redirects=True, timeout=120) as client:
    response = client.get(DATASET_URL)
    response.raise_for_status()
print(f"  Downloaded {len(response.content) / 1_000_000:.1f} MB.")

print("  Extracting dataset...")
with zipfile.ZipFile(BytesIO(response.content)) as zf:
    csv_files = [f for f in zf.namelist() if f.endswith(".csv")]

    if not csv_files:
        raise RuntimeError("No CSV found in zip")

    zf.extract(csv_files[0], OUT_DIR)
    extracted = OUT_DIR / csv_files[0]

    if extracted.name != "TMDB_all_movies.csv":
        extracted.rename(OUT_DIR / "TMDB_all_movies.csv")

print("Download complete.")
