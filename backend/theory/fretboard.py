from backend.theory.tunings import Tuning, get_tuning

SINGLE_DOTS = {3, 5, 7, 9, 15, 17, 19, 21}
DOUBLE_DOTS = {12, 24}


def note_at(string_index: int, fret: int, tuning: Tuning | None = None) -> int:
    if tuning is None:
        tuning = get_tuning()
    open_note = tuning.strings[string_index]
    return (open_note + fret) % 12


def build_fretboard_map(
    tuning: Tuning | None = None,
    fret_count: int = 12,
) -> list[list[int]]:
    if tuning is None:
        tuning = get_tuning()
    result = []
    for string_idx in range(len(tuning.strings)):
        string_notes = []
        for fret in range(fret_count + 1):  # 0 = open string
            string_notes.append(note_at(string_idx, fret, tuning))
        result.append(string_notes)
    return result


def find_note_positions(
    chromatic_index: int,
    tuning: Tuning | None = None,
    fret_count: int = 12,
    min_fret: int = 0,
    max_fret: int | None = None,
) -> list[dict]:
    if tuning is None:
        tuning = get_tuning()
    if max_fret is None:
        max_fret = fret_count
    positions = []
    for string_idx in range(len(tuning.strings)):
        for fret in range(min_fret, max_fret + 1):
            if note_at(string_idx, fret, tuning) == chromatic_index:
                positions.append({"string": string_idx, "fret": fret})
    return positions


def get_dot_positions(fret_count: int = 12) -> list[dict]:
    dots = []
    for fret in range(1, fret_count + 1):
        if fret in SINGLE_DOTS:
            dots.append({"fret": fret, "double": False})
        elif fret in DOUBLE_DOTS:
            dots.append({"fret": fret, "double": True})
    return dots
