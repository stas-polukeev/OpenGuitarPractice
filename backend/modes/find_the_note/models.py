from pydantic import BaseModel


class ChallengeRequest(BaseModel):
    tuning: str = "standard"
    notation: str = "english"
    prefer_sharps: bool = True
    min_fret: int = 0
    max_fret: int = 12
    allowed_notes: list[int] | None = None  # chromatic indices; None = naturals only


class ChallengeResponse(BaseModel):
    challenge_id: str
    string_index: int
    string_name: str
    note_name: str
    chromatic_index: int


class AnswerRequest(BaseModel):
    challenge_id: str
    fret: int


class AnswerResponse(BaseModel):
    correct: bool
    expected_frets: list[int]
    tapped_fret: int
