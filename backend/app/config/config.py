from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_application_credentials: str
    firebase_project_id: str
    firebase_database_id: str = "(default)"  # fallback default
    environment: str = "PROD"

    game_queueing_tick: int = 3

    class Config:
        env_file = ".env"

