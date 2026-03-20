from backend.theory.fretboard import (
    note_at,
    build_fretboard_map,
    find_note_positions,
    get_dot_positions,
)
from backend.theory.tunings import STANDARD


class TestNoteAt:
    def test_open_strings_standard(self):
        # Standard tuning: E A D G B E
        assert note_at(0, 0, STANDARD) == 4   # E
        assert note_at(1, 0, STANDARD) == 9   # A
        assert note_at(2, 0, STANDARD) == 2   # D
        assert note_at(3, 0, STANDARD) == 7   # G
        assert note_at(4, 0, STANDARD) == 11  # B
        assert note_at(5, 0, STANDARD) == 4   # E

    def test_fretted_notes(self):
        # 5th fret low E = A (index 9)
        assert note_at(0, 5, STANDARD) == 9
        # 12th fret = same as open (octave)
        assert note_at(0, 12, STANDARD) == 4

    def test_wraps_at_12(self):
        assert note_at(0, 12, STANDARD) == note_at(0, 0, STANDARD)


class TestBuildFretboardMap:
    def test_dimensions(self):
        fb = build_fretboard_map(STANDARD, 12)
        assert len(fb) == 6  # 6 strings
        assert len(fb[0]) == 13  # frets 0-12

    def test_values_match_note_at(self):
        fb = build_fretboard_map(STANDARD, 12)
        for s in range(6):
            for f in range(13):
                assert fb[s][f] == note_at(s, f, STANDARD)


class TestFindNotePositions:
    def test_find_e_on_fretboard(self):
        positions = find_note_positions(4, STANDARD, 12)  # E
        assert len(positions) > 0
        # Open 1st and 6th string should be included
        assert {"string": 0, "fret": 0} in positions
        assert {"string": 5, "fret": 0} in positions

    def test_respects_fret_range(self):
        positions = find_note_positions(4, STANDARD, 12, min_fret=1, max_fret=5)
        for pos in positions:
            assert 1 <= pos["fret"] <= 5

    def test_find_all_c(self):
        positions = find_note_positions(0, STANDARD, 12)  # C
        # C should appear multiple times across strings
        assert len(positions) >= 3


class TestDotPositions:
    def test_standard_dots(self):
        dots = get_dot_positions(12)
        frets = [d["fret"] for d in dots]
        assert 3 in frets
        assert 5 in frets
        assert 7 in frets
        assert 9 in frets
        assert 12 in frets

    def test_double_dot_at_12(self):
        dots = get_dot_positions(12)
        dot_12 = next(d for d in dots if d["fret"] == 12)
        assert dot_12["double"] is True

    def test_single_dots(self):
        dots = get_dot_positions(12)
        dot_3 = next(d for d in dots if d["fret"] == 3)
        assert dot_3["double"] is False
