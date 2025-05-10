import pandas as pd
import random
from typing import List, Optional

# Global cache for questions
QUESTION_BANK: List[dict] = []

def load_questions_from_csv(csv_path: str) -> None:
    """Load questions from a CSV file into the QUESTION_BANK."""
    global QUESTION_BANK
    df = pd.read_csv(csv_path)

    formatted_questions = []
    for _, row in df.iterrows():
        choices = [row["a"], row["b"], row["c"], row["d"]]
        question = {
            "question": row["question"],
            "choices": choices,
            "answer": int(row["answer"]),  # assumes answer is 0-based or 1-based
            "genre": row["genre"],
        }
        formatted_questions.append(question)

    QUESTION_BANK.clear()
    QUESTION_BANK.extend(formatted_questions)
    print(f"Loaded {len(QUESTION_BANK)} questions from {csv_path}.")

def get_random_questions(amount: int = 10, genre: Optional[str] = None) -> List[dict]:
    """Retrieve a list of random questions, optionally filtered by genre."""
    filtered = (
        [q for q in QUESTION_BANK if q["genre"].lower() == genre.lower()]
        if genre else QUESTION_BANK
    )
    if not filtered:
        return []
    return random.sample(filtered, min(amount, len(filtered)))
