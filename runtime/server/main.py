from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

from tmdb import tmdb_get
from recommend import get_recommendations

app = FastAPI()


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
    imdb_vote_weight: float = Query(default=0.0, ge=0.0, le=1.0),
    tmdb_popular_weight: float = Query(default=0.0, ge=0.0, le=1.0),
    pool_size: float = Query(default=0.0, ge=0.0, le=1.0),
):
    if len(liked) < 5:
        raise HTTPException(
            status_code=400, detail="At least 5 liked movies are required."
        )

    return await get_recommendations(
        liked, disliked, imdb_vote_weight, tmdb_popular_weight, pool_size
    )


app.mount(
    "/",
    StaticFiles(directory=str(Path(__file__).parent / "public"), html=True),
    name="static",
)
