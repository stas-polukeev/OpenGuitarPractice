from pydantic import BaseModel


class TuningInfo(BaseModel):
    slug: str
    name: str
    string_names: list[str]


class NotationInfo(BaseModel):
    slug: str
    label: str
