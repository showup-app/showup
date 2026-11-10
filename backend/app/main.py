from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, games, health, me

app = FastAPI(
    title="ShowUp API",
    version="0.1.0",
    description="Drop-in sports games with a show-up reputation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(games.router)
app.include_router(auth.router)
app.include_router(me.router)
