from contextlib import asynccontextmanager
from fastapi import APIRouter, FastAPI, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, Response
import os
import logging
from pathlib import Path


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from lib.db import client, db
from routers.health import router as health_router
from routers.ipos import router as ipos_router


# Startup runs before the yield, shutdown after it. Add your own setup/teardown here.
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    client.close()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "IPO GMP Tracker API"}


api_router.include_router(health_router)
api_router.include_router(ipos_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.middleware("http")
async def serve_frontend(request: Request, call_next) -> Response:
    """Serve the Vite build on a Render web service without intercepting /api."""
    if request.url.path.startswith("/api"):
        return await call_next(request)
    frontend_dist = ROOT_DIR.parent / "frontend" / "dist"
    if frontend_dist.exists():
        requested = (frontend_dist / request.url.path.lstrip("/")).resolve()
        if requested.is_file() and frontend_dist.resolve() in requested.parents:
            return FileResponse(requested)
        index = frontend_dist / "index.html"
        if index.exists():
            return FileResponse(index)
    return await call_next(request)


# Include the router last so every API route remains under /api.
app.include_router(api_router)
