from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api import api_router

load_dotenv()

PUBLIC_DIR = Path(__file__).parent / "public"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://c964.dylandevs.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(api_router)
app.mount(
    "/assets",
    StaticFiles(directory=PUBLIC_DIR / "assets"),
    name="assets",
)


@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    file = PUBLIC_DIR / full_path

    if file.is_file():
        return FileResponse(file)

    return FileResponse(PUBLIC_DIR / "index.html")
