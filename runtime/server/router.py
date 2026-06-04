import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import APIKeyHeader

from recommend import get_recommendations
from tmdb import tmdb_get


_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Require API requests, except for static files, to provide a "secret" x-api-key
# header. Again, only a deterrent but easy enough to implement.


async def _verify_api_key(key: str = Depends(_api_key_header)):
    if key != os.getenv("API_KEY"):
        raise HTTPException(status_code=403, detail="Forbidden")


router = APIRouter(prefix="/api", dependencies=[Depends(_verify_api_key)])


@router.get("/search")
async def search(query: str, page: int = 1):
    return await tmdb_get("/3/search/movie", {"query": query, "page": page})


@router.get("/top_rated")
async def top_rated(page: int = 1):
    return await tmdb_get("/3/movie/top_rated", {"page": page})


@router.get("/trending")
async def trending(page: int = 1):
    return await tmdb_get("/3/movie/popular", {"page": page})


@router.get("/movie/{movie_id}")
async def movie(movie_id: int):
    return await tmdb_get(f"/3/movie/{movie_id}")


@router.get("/recommendations")
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
