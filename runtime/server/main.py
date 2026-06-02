import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

from recommend import (
    compute_pref_vector,
    recommend,
    get_vector,
    get_rating,
    compute_text_vector,
    build_movie_text,
    movie_ids,
    most_similar,
    top_terms,
)

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
    return compute_text_vector(text)


@app.get("/api/recommendations")
async def recommendations(
    liked: list[int] = Query(default=[]),
    disliked: list[int] = Query(default=[]),
    sort_by: str | None = None,
):
    if len(liked) < 5:
        raise HTTPException(
            status_code=400,
            detail="At least 5 liked movies are required.",
        )

    all_ids = list(dict.fromkeys([*liked, *disliked]))
    all_vectors = dict(
        zip(all_ids, await asyncio.gather(*[resolve_vector(id) for id in all_ids]))
    )

    liked_vectors = [all_vectors[id] for id in liked]
    disliked_vectors = [all_vectors[id] for id in disliked]
    pref = compute_pref_vector(liked_vectors, disliked_vectors)

    scores = recommend(pref)
    excluded = set(liked) | set(disliked)
    ranked = sorted(
        (
            (movie_ids[i], float(scores[i]))
            for i in range(len(movie_ids))
            if movie_ids[i] not in excluded
        ),
        key=lambda x: -x[1],
    )[:50]

    rec_vectors = [get_vector(id) for id, _ in ranked]
    movies = await asyncio.gather(*[tmdb_get(f"/3/movie/{id}") for id, _ in ranked])
    results = [
        {
            "_rec_score": score,
            "_rec_similar_to": liked[most_similar(rec_vec, liked_vectors)],
            "_imdb_rating": get_rating(id),
            **movie,
        }
        for movie, (id, score), rec_vec in zip(movies, ranked, rec_vectors)
    ]

    if sort_by == "imdb_rating":
        results.sort(key=lambda m: m["_imdb_rating"] or 0, reverse=True)

    return {"_rec_terms": top_terms(pref), "results": results}


app.mount(
    "/",
    StaticFiles(directory=str(Path(__file__).parent / "public"), html=True),
    name="static",
)
