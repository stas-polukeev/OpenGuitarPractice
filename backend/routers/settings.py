from fastapi import APIRouter

from backend.theory.notes import NOTATION_SYSTEMS
from backend.theory.tunings import TUNINGS
from backend.schemas.settings import TuningInfo, NotationInfo

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/tunings")
def list_tunings() -> list[TuningInfo]:
    return [
        TuningInfo(slug=t.slug, name=t.name, string_names=t.string_names)
        for t in TUNINGS.values()
    ]


@router.get("/notations")
def list_notations() -> list[NotationInfo]:
    return [
        NotationInfo(slug=slug, label=data["label"])
        for slug, data in NOTATION_SYSTEMS.items()
    ]
