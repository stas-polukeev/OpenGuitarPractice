import pytest
from backend.modes.find_the_note.logic import generate_challenge, check_answer
from backend.theory.notes import NATURAL_NOTE_INDICES


class TestGenerateChallenge:
    def test_returns_required_fields(self):
        c = generate_challenge()
        assert "challenge_id" in c
        assert "string_index" in c
        assert "string_name" in c
        assert "note_name" in c
        assert "chromatic_index" in c

    def test_note_is_natural_by_default(self):
        for _ in range(50):
            c = generate_challenge()
            assert c["chromatic_index"] in NATURAL_NOTE_INDICES

    def test_respects_allowed_notes(self):
        for _ in range(50):
            c = generate_challenge(allowed_notes=[0, 4])  # C and E only
            assert c["chromatic_index"] in [0, 4]

    def test_string_in_range(self):
        for _ in range(50):
            c = generate_challenge()
            assert 0 <= c["string_index"] <= 5

    def test_different_notations(self):
        c_en = generate_challenge(notation="english")
        c_ru = generate_challenge(notation="russian")
        # Both should work without error
        assert isinstance(c_en["note_name"], str)
        assert isinstance(c_ru["note_name"], str)


class TestCheckAnswer:
    def test_correct_answer(self):
        c = generate_challenge(min_fret=0, max_fret=12)
        # Find a correct fret for this challenge
        from backend.theory.fretboard import note_at
        from backend.theory.tunings import get_tuning
        tuning = get_tuning()
        correct_fret = None
        for f in range(13):
            if note_at(c["string_index"], f, tuning) == c["chromatic_index"]:
                correct_fret = f
                break
        assert correct_fret is not None
        result = check_answer(c["challenge_id"], correct_fret)
        assert result["correct"] is True

    def test_wrong_answer(self):
        # Generate challenge and give a definitely wrong answer
        c = generate_challenge(min_fret=0, max_fret=12, allowed_notes=[0])  # C only
        from backend.theory.fretboard import note_at
        from backend.theory.tunings import get_tuning
        tuning = get_tuning()
        wrong_fret = None
        for f in range(13):
            if note_at(c["string_index"], f, tuning) != c["chromatic_index"]:
                wrong_fret = f
                break
        result = check_answer(c["challenge_id"], wrong_fret)
        assert result["correct"] is False
        assert len(result["expected_frets"]) > 0

    def test_expired_challenge_raises(self):
        with pytest.raises(ValueError):
            check_answer("nonexistent", 5)

    def test_challenge_kept_on_wrong_consumed_on_correct(self):
        c = generate_challenge(min_fret=0, max_fret=12, allowed_notes=[0])  # C only
        from backend.theory.fretboard import note_at
        from backend.theory.tunings import get_tuning
        tuning = get_tuning()
        # Find a wrong fret
        wrong = None
        correct = None
        for f in range(13):
            if note_at(c["string_index"], f, tuning) != c["chromatic_index"]:
                wrong = f
            else:
                correct = f
        # Wrong answer does NOT consume
        result = check_answer(c["challenge_id"], wrong)
        assert result["correct"] is False
        # Challenge still exists, can try again
        result2 = check_answer(c["challenge_id"], correct)
        assert result2["correct"] is True
        # Now consumed
        with pytest.raises(ValueError):
            check_answer(c["challenge_id"], correct)
