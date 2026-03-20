from fastapi import APIRouter, HTTPException

from backend.modes.find_the_note.models import (
    ChallengeRequest,
    ChallengeResponse,
    AnswerRequest,
    AnswerResponse,
)
from backend.modes.find_the_note.logic import generate_challenge, check_answer

MODE_META = {
    "slug": "find-the-note",
    "name": "Find the Note",
    "description": "Find the requested note on the fretboard",
}

router = APIRouter()


@router.post("/challenge", response_model=ChallengeResponse)
def create_challenge(req: ChallengeRequest):
    result = generate_challenge(
        tuning_slug=req.tuning,
        notation=req.notation,
        prefer_sharps=req.prefer_sharps,
        min_fret=req.min_fret,
        max_fret=req.max_fret,
        allowed_notes=req.allowed_notes,
    )
    return result


@router.post("/answer", response_model=AnswerResponse)
def submit_answer(req: AnswerRequest):
    try:
        result = check_answer(req.challenge_id, req.fret)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result
