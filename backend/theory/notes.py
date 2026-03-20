NOTATION_SYSTEMS: dict[str, dict] = {
    "english": {
        "label": "English (A B C ...)",
        "notes": ["C", "D", "E", "F", "G", "A", "B"],
        "sharps": ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        "flats": ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
    },
    "russian": {
        "label": "Russian",
        "notes": ["До", "Ре", "Ми", "Фа", "Соль", "Ля", "Си"],
        "sharps": [
            "До", "До#", "Ре", "Ре#", "Ми", "Фа",
            "Фа#", "Соль", "Соль#", "Ля", "Ля#", "Си",
        ],
        "flats": [
            "До", "Реb", "Ре", "Миb", "Ми", "Фа",
            "Сольb", "Соль", "Ляb", "Ля", "Сиb", "Си",
        ],
    },
    "latin": {
        "label": "Latin (Do Re Mi ...)",
        "notes": ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti"],
        "sharps": [
            "Do", "Do#", "Re", "Re#", "Mi", "Fa",
            "Fa#", "Sol", "Sol#", "La", "La#", "Ti",
        ],
        "flats": [
            "Do", "Reb", "Re", "Mib", "Mi", "Fa",
            "Solb", "Sol", "Lab", "La", "Tib", "Ti",
        ],
    },
}

# Chromatic indices of natural notes (no sharps/flats)
NATURAL_NOTE_INDICES = [0, 2, 4, 5, 7, 9, 11]


def chromatic_to_name(index: int, notation: str = "english", prefer_sharps: bool = True) -> str:
    system = NOTATION_SYSTEMS[notation]
    names = system["sharps"] if prefer_sharps else system["flats"]
    return names[index % 12]


def name_to_chromatic(name: str, notation: str = "english") -> int | None:
    system = NOTATION_SYSTEMS[notation]
    for names in (system["sharps"], system["flats"]):
        if name in names:
            return names.index(name)
    return None


def get_all_note_names(notation: str = "english", prefer_sharps: bool = True) -> list[str]:
    system = NOTATION_SYSTEMS[notation]
    return list(system["sharps"] if prefer_sharps else system["flats"])


def get_natural_notes(notation: str = "english") -> list[str]:
    return NOTATION_SYSTEMS[notation]["notes"]


def is_natural(index: int) -> bool:
    return (index % 12) in NATURAL_NOTE_INDICES
