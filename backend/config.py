from functools import lru_cache

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    gemini_api_key: str
    jwt_secret: str

    model_config = {"env_file": ".env"}

@lru_cache
def get_settings() -> Settings:
    return Settings()