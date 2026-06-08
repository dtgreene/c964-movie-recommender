import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import APIKeyHeader

from recommend import get_recommendations, get_taste
from tmdb import tmdb_get

MODEL_DIR = Path(__file__).parent / "model"

with open(MODEL_DIR / "visuals_meta.json") as f:
    _visuals_meta = json.load(f)


api_user_header = APIKeyHeader(name="X-API-User", auto_error=False)

# Require API requests, except for static files, to provide a "secret" x-api-user
# header. Again, only a deterrent but easy enough to implement.


async def _verify_user_header(key: str = Depends(api_user_header)):
    if key != "C964":
        raise HTTPException(status_code=403, detail="Forbidden")


api_router = APIRouter(prefix="/api", dependencies=[Depends(_verify_user_header)])


@api_router.get("/visuals-meta")
async def visuals_meta():
    return _visuals_meta


@api_router.get("/search")
async def search(query: str, page: int = 1):
    return await tmdb_get("/3/search/movie", {"query": query, "page": page})


@api_router.get("/top_rated")
async def top_rated(page: int = 1):
    return await tmdb_get("/3/movie/top_rated", {"page": page})


@api_router.get("/trending")
async def trending(page: int = 1):
    return await tmdb_get("/3/movie/popular", {"page": page})


@api_router.get("/movie/{movie_id}")
async def movie(movie_id: int):
    return await tmdb_get(f"/3/movie/{movie_id}")


@api_router.get("/taste")
async def taste(liked: list[int] = Query(default=[])):
    if not liked:
        raise HTTPException(
            status_code=400, detail="At least one liked movie is required."
        )
    return await get_taste(liked)


@api_router.get("/recommendations")
async def recommendations(
    liked: list[int] = Query(default=[]),
    disliked: list[int] = Query(default=[]),
    imdb_vote_weight: float = Query(default=0.0, ge=0.0, le=1.0),
    tmdb_popular_weight: float = Query(default=0.0, ge=0.0, le=1.0),
    pool_size: float = Query(default=0.0, ge=0.0, le=1.0),
    dislike_weight: float = Query(default=0.0, ge=0.0, le=1.0),
    min_year: int = Query(default=None, ge=1900, le=2100),
    languages: list[str] = Query(default=[]),
):
    if len(liked) < 1:
        raise HTTPException(
            status_code=400, detail="At least one liked movie is required."
        )

    return await get_recommendations(
        liked,
        disliked,
        imdb_vote_weight,
        tmdb_popular_weight,
        pool_size,
        dislike_weight,
        min_year,
        languages,
    )
