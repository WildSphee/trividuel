from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_application_credentials: str
    firebase_project_id: str
    firebase_database_id: str = "(default)"
    environment: str = "PROD"

    game_queueing_tick: int = 3
    HEARTBEAT_INTERVAL: int = 10

    # ELO Calculation
    K_FACTOR_DEFAULT: int = 32
    MIN_ELO: int = 100

    # QUESTIONS
    QUESTION_SET_PATH: str = (
        r"/home/azureuser/trividuel/backend/app/data/combined_quiz.csv"
    )

    class Config:
        env_file = ".env"
