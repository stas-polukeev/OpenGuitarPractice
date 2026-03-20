from pydantic import BaseModel


class FretPosition(BaseModel):
    string: int
    fret: int


class NoteInfo(BaseModel):
    chromatic_index: int
    name: str


class DotPosition(BaseModel):
    fret: int
    double: bool


class FretboardMap(BaseModel):
    tuning_slug: str
    string_names: list[str]
    fret_count: int
    notes: list[list[int]]
    dots: list[DotPosition]
