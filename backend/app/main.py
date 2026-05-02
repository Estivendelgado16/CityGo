from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.routers import auth, onboarding, chat, places, feedback, conversations


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 CityGo Backend arrancando...")
    yield
    print("👋 CityGo Backend cerrando...")


app = FastAPI(
    title="CityGo API",
    description="Agente turístico de Medellín",
    version="0.1.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(onboarding.router, prefix="/api", tags=["Onboarding"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(places.router, prefix="/api", tags=["Places"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])
app.include_router(conversations.router, prefix="/api", tags=["Conversations"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "CityGo-api"}
