# tests/test_prepare_questions.py
import pandas as pd
import pytest

from app.utils import prepare_questions


@pytest.fixture
def mock_question_df():
    return pd.DataFrame(
        [
            {
                "question": "What is H2O?",
                "answer": 1,
                "a": "Hydrogen",
                "b": "Water",
                "c": "Oxygen",
                "d": "Helium",
                "genre": "science",
            },
            {
                "question": "Who discovered America?",
                "answer": 2,
                "a": "Columbus",
                "b": "Magellan",
                "c": "Vespucci",
                "d": "Da Gama",
                "genre": "history",
            },
        ]
    )


def _patch_read_csv(monkeypatch, df):
    monkeypatch.setattr("app.utils.prepare_questions.pd.read_csv", lambda _path: df)


@pytest.mark.asyncio
async def test_load_questions_from_csv(monkeypatch, mock_question_df):
    _patch_read_csv(monkeypatch, mock_question_df)

    await prepare_questions.load_questions_from_csv("fake.csv")
    assert len(prepare_questions.get_random_questions(amount=2)) == 2


@pytest.mark.asyncio
async def test_get_random_questions_no_res(monkeypatch, mock_question_df):
    _patch_read_csv(monkeypatch, mock_question_df)

    await prepare_questions.load_questions_from_csv("fake.csv")
    qs = prepare_questions.get_random_questions(genre="DOESNT EXIST")
    assert qs == []


@pytest.mark.asyncio
async def test_get_random_questions_with_genre(monkeypatch, mock_question_df):
    _patch_read_csv(monkeypatch, mock_question_df)

    await prepare_questions.load_questions_from_csv("fake.csv")
    qs = prepare_questions.get_random_questions(amount=1, genre="science")
    assert len(qs) == 1
    assert qs[0].genre.lower() == "science"
