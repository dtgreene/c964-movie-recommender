import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles

from recommend import recommend, get_vector, compute_vector, build_movie_text

load_dotenv()

# https://developer.themoviedb.org/reference/getting-started

TMDB_BASE = "https://api.themoviedb.org"
TMDB_HEADERS = {
    "Authorization": f"Bearer {os.environ['TMDB_READ_ACCESS_TOKEN']}",
    "Accept": "application/json",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(base_url=TMDB_BASE, headers=TMDB_HEADERS) as client:
        app.state.tmdb = client
        yield


app = FastAPI(lifespan=lifespan)


async def tmdb_get(path, params=None):
    response = await app.state.tmdb.get(
        path, params={"language": "en-US", **(params or {})}
    )
    response.raise_for_status()
    return response.json()


@app.get("/api/search")
async def search(query: str, page: int = 1):
    return await tmdb_get("/3/search/movie", {"query": query, "page": page})


@app.get("/api/top_rated")
async def top_rated(page: int = 1):
    return await tmdb_get("/3/movie/top_rated", {"page": page})


@app.get("/api/trending")
async def trending(page: int = 1):
    return await tmdb_get("/3/movie/popular", {"page": page})


@app.get("/api/movie/{movie_id}")
async def movie(movie_id: int):
    return await tmdb_get(f"/3/movie/{movie_id}")


@app.get("/api/recommendations")
async def recommendations(
    liked: list[int] = Query(default=[]),
    disliked: list[int] = Query(default=[]),
):
    unknown_ids = [id for id in [*liked, *disliked] if get_vector(id) is None]

    if unknown_ids:
        details_and_credits = [
            (
                await tmdb_get(f"/3/movie/{id}"),
                await tmdb_get(f"/3/movie/{id}/credits"),
            )
            for id in unknown_ids
        ]
        for id, (details, credits) in zip(unknown_ids, details_and_credits):
            text = build_movie_text(details, credits)
            _ = compute_vector(text)  # TODO: pass synthesized vector into recommend()

    return recommend(liked, disliked)


app.mount(
    "/",
    StaticFiles(directory=str(Path(__file__).parent / "public"), html=True),
    name="static",
)
