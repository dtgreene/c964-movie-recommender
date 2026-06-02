import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles

from recommend import recommend, get_vector, compute_vector, build_movie_text, movie_ids

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


async def resolve_vector(id):
    # Try and lookup the vector from the list produced by the training data
    vector = get_vector(id)

    if vector is not None:
        return vector

    # Since this movie wasnt in the training data, we need to fetch the details
    # to create the text representation + vector.
    [details, credits] = await asyncio.gather(
        tmdb_get(f"/3/movie/{id}"),
        tmdb_get(f"/3/movie/{id}/credits"),
    )
    text = build_movie_text(details, credits)
    return compute_vector(text)


@app.get("/api/recommendations")
async def recommendations(
    liked: list[int] = Query(default=[]),
    disliked: list[int] = Query(default=[]),
):
    all_ids = list(dict.fromkeys([*liked, *disliked]))
    vectors = dict(
        zip(all_ids, await asyncio.gather(*[resolve_vector(id) for id in all_ids]))
    )

    scores = recommend([vectors[id] for id in liked], [vectors[id] for id in disliked])
    if scores is None:
        return []

    excluded = set(liked) | set(disliked)
    ranked = sorted(
        (
            (movie_ids[i], float(scores[i]))
            for i in range(len(movie_ids))
            if movie_ids[i] not in excluded
        ),
        key=lambda x: -x[1],
    )
    top_ids = [id for id, _ in ranked[:20]]
    return await asyncio.gather(*[tmdb_get(f"/3/movie/{id}") for id in top_ids])


app.mount(
    "/",
    StaticFiles(directory=str(Path(__file__).parent / "public"), html=True),
    name="static",
)
