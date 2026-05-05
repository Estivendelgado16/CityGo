from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # OpenAI
    OPENAI_API_KEY: str = ""

    # App
    ENVIRONMENT: str = "development"
    MAX_AGENT_ITERATIONS: int = 5
    FRONTEND_URL: str = "http://localhost:5173"

    # RAG Tuning
    RAG_MATCH_THRESHOLD: float = 0.3
    RAG_FEEDBACK_WEIGHT: float = 0.15
    RAG_RATING_WEIGHT: float = 0.10
    RAG_POSITIVE_FEEDBACK_WEIGHT: float = 0.12

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
