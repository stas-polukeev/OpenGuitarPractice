import random
import uuid

from backend.theory.fretboard import note_at
from backend.theory.notes import chromatic_to_name, NATURAL_NOTE_INDICES
from backend.theory.tunings import get_tuning

_challenges: dict[str, dict] = {}
MAX_CHALLENGES = 200


def generate_challenge(
    tuning_slug: str = "standard",
    notation: str = "english",
    prefer_sharps: bool = True,
    min_fret: int = 0,
    max_fret: int = 12,
    allowed_notes: list[int] | None = None,
) -> dict:
    tuning = get_tuning(tuning_slug)

    if allowed_notes is None:
        allowed_notes = list(NATURAL_NOTE_INDICES)

    allowed_set = set(allowed_notes)

    # Build valid (string, note) pairs reachable within fret range
    valid_pairs = []
    for s in range(len(tuning.strings)):
        reachable = set()
        for f in range(min_fret, max_fret + 1):
            n = note_at(s, f, tuning)
            if n in allowed_set:
                reachable.add(n)
        for n in reachable:
            valid_pairs.append((s, n))

    if not valid_pairs:
        raise ValueError("No valid note/string combinations for given settings")

    string_index, note = random.choice(valid_pairs)
    note_name = chromatic_to_name(note, notation, prefer_sharps)

    challenge_id = uuid.uuid4().hex[:12]

    if len(_challenges) > MAX_CHALLENGES:
        oldest_keys = list(_challenges.keys())[: MAX_CHALLENGES // 2]
        for k in oldest_keys:
            del _challenges[k]

    _challenges[challenge_id] = {
        "string_index": string_index,
        "chromatic_index": note,
        "tuning_slug": tuning_slug,
        "min_fret": min_fret,
        "max_fret": max_fret,
    }

    return {
        "challenge_id": challenge_id,
        "string_index": string_index,
        "string_name": tuning.string_names[string_index],
        "note_name": note_name,
        "chromatic_index": note,
    }


def check_answer(challenge_id: str, fret: int) -> dict:
    challenge = _challenges.get(challenge_id)
    if challenge is None:
        raise ValueError("Challenge not found or expired")

    tuning = get_tuning(challenge["tuning_slug"])
    string_index = challenge["string_index"]
    target = challenge["chromatic_index"]
    min_fret = challenge["min_fret"]
    max_fret = challenge["max_fret"]

    expected_frets = []
    for f in range(min_fret, max_fret + 1):
        if note_at(string_index, f, tuning) == target:
            expected_frets.append(f)

    correct = fret in expected_frets

    # Only consume on correct answer (user keeps trying on wrong)
    if correct:
        del _challenges[challenge_id]

    return {
        "correct": correct,
        "expected_frets": expected_frets,
        "tapped_fret": fret,
    }
