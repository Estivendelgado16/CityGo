from fastapi import FastAPI, Request 
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import logging
import uuid
from app.exception.handlers import app_exception_handler
from app.exception.custom_exception import AppException

from app.config import get_settings
from app.routers import auth, onboarding, chat, places, feedback, conversations

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 CityGo Backend arrancando...")
    yield
    logger.info("👋 CityGo Backend cerrando...")


app = FastAPI(
    title="CityGo API",
    description="Agente turístico de Medellín",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_exception_handler(
    AppException,
    app_exception_handler
)

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())

    logger.info(f"➡️ Request iniciada - ID: {request_id}")

    response = await call_next(request)

    response.headers["X-Request-ID"] = request_id

    logger.info(f"✅ Request finalizada - ID: {request_id}")

    return response

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
