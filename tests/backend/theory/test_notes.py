from backend.theory.notes import (
    chromatic_to_name,
    name_to_chromatic,
    get_all_note_names,
    get_natural_notes,
    is_natural,
    NATURAL_NOTE_INDICES,
)


class TestChromaticToName:
    def test_english_sharps(self):
        assert chromatic_to_name(0, "english", True) == "C"
        assert chromatic_to_name(1, "english", True) == "C#"
        assert chromatic_to_name(4, "english", True) == "E"
        assert chromatic_to_name(11, "english", True) == "B"

    def test_english_flats(self):
        assert chromatic_to_name(1, "english", False) == "Db"
        assert chromatic_to_name(3, "english", False) == "Eb"
        assert chromatic_to_name(6, "english", False) == "Gb"

    def test_russian(self):
        assert chromatic_to_name(0, "russian") == "До"
        assert chromatic_to_name(7, "russian") == "Соль"
        assert chromatic_to_name(9, "russian") == "Ля"

    def test_latin(self):
        assert chromatic_to_name(0, "latin") == "Do"
        assert chromatic_to_name(4, "latin") == "Mi"
        assert chromatic_to_name(11, "latin") == "Ti"

    def test_wraps_around(self):
        assert chromatic_to_name(12) == "C"
        assert chromatic_to_name(13) == "C#"


class TestNameToChromatic:
    def test_english_roundtrip(self):
        for i in range(12):
            name = chromatic_to_name(i, "english", True)
            assert name_to_chromatic(name, "english") == i

    def test_flats_roundtrip(self):
        for i in range(12):
            name = chromatic_to_name(i, "english", False)
            assert name_to_chromatic(name, "english") == i

    def test_unknown_returns_none(self):
        assert name_to_chromatic("X#", "english") is None


class TestNaturalNotes:
    def test_english_naturals(self):
        assert get_natural_notes("english") == ["C", "D", "E", "F", "G", "A", "B"]

    def test_russian_naturals(self):
        naturals = get_natural_notes("russian")
        assert len(naturals) == 7
        assert naturals[0] == "До"

    def test_is_natural(self):
        for i in NATURAL_NOTE_INDICES:
            assert is_natural(i)
        assert not is_natural(1)  # C#
        assert not is_natural(6)  # F#


class TestGetAllNoteNames:
    def test_returns_12_notes(self):
        names = get_all_note_names("english")
        assert len(names) == 12

    def test_all_three_systems(self):
        for notation in ("english", "russian", "latin"):
            names = get_all_note_names(notation)
            assert len(names) == 12
