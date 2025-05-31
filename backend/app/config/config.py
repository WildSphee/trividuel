from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_application_credentials: str
    firebase_project_id: str
    firebase_database_id: str = "(default)"
    environment: str = "PROD"
    geoloc_data_path: str

    # INTERVAL TASKS
    QUEUEING_TICK: int = 3
    HEARTBEAT_INTERVAL: int = 10
    LEADERBOARD_INTERVAL: int = 600
    ZOMBIE_SWEEPER_INTERVAL: int = 3

    # ELO Calculation
    K_FACTOR_DEFAULT: int = 32
    MIN_ELO: int = 100

    # QUESTIONS
    QUESTION_SET_PATH: str

    class Config:
        env_file = ".env"
