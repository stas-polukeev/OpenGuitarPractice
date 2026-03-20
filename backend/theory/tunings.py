from dataclasses import dataclass


@dataclass(frozen=True)
class Tuning:
    name: str
    slug: str
    strings: list[int]       # chromatic indices, low to high (6th to 1st string)
    string_names: list[str]  # display names for each string

    def __hash__(self):
        return hash(self.slug)


STANDARD = Tuning(
    name="Standard (EADGBe)",
    slug="standard",
    strings=[4, 9, 2, 7, 11, 4],   # E2 A2 D3 G3 B3 E4
    string_names=["E", "A", "D", "G", "B", "e"],
)

TUNINGS: dict[str, Tuning] = {
    "standard": STANDARD,
}


def get_tuning(slug: str = "standard") -> Tuning:
    return TUNINGS[slug]
