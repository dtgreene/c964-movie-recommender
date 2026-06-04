import os
import httpx
from dotenv import load_dotenv

load_dotenv()

_tmdb = httpx.AsyncClient(
    base_url="https://api.themoviedb.org",
    headers={
        "Authorization": f"Bearer {os.environ['TMDB_READ_ACCESS_TOKEN']}",
        "Accept": "application/json",
    },
)


async def tmdb_get(path, params=None):
    response = await _tmdb.get(path, params={"language": "en-US", **(params or {})})
    response.raise_for_status()
    return response.json()
