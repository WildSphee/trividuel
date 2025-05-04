from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_application_credentials: str
    firebase_project_id: str
    firebase_database_id: str = "(default)"  # fallback default
    environment: str = "PROD"

    class Config:
        env_file = ".env"


settings = Settings()
