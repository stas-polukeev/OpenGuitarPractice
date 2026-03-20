from fastapi import APIRouter, Query

from backend.config import DEFAULT_FRET_COUNT, DEFAULT_NOTATION, DEFAULT_TUNING
from backend.theory.fretboard import build_fretboard_map, get_dot_positions
from backend.theory.notes import get_all_note_names, get_natural_notes, NOTATION_SYSTEMS
from backend.theory.tunings import get_tuning
from backend.schemas.common import FretboardMap, DotPosition

router = APIRouter(prefix="/api/theory", tags=["theory"])


@router.get("/fretboard")
def get_fretboard(
    tuning: str = Query(DEFAULT_TUNING),
    fret_count: int = Query(DEFAULT_FRET_COUNT, ge=1, le=24),
) -> FretboardMap:
    t = get_tuning(tuning)
    notes = build_fretboard_map(t, fret_count)
    dots = [DotPosition(**d) for d in get_dot_positions(fret_count)]
    return FretboardMap(
        tuning_slug=tuning,
        string_names=t.string_names,
        fret_count=fret_count,
        notes=notes,
        dots=dots,
    )


@router.get("/notes")
def get_notes(
    notation: str = Query(DEFAULT_NOTATION),
    prefer_sharps: bool = Query(True),
) -> dict:
    return {
        "notation": notation,
        "prefer_sharps": prefer_sharps,
        "chromatic": get_all_note_names(notation, prefer_sharps),
        "natural": get_natural_notes(notation),
    }
