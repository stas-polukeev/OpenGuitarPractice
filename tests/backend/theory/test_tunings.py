from backend.theory.tunings import STANDARD, get_tuning, TUNINGS


class TestStandardTuning:
    def test_has_6_strings(self):
        assert len(STANDARD.strings) == 6
        assert len(STANDARD.string_names) == 6

    def test_open_string_values(self):
        # E=4, A=9, D=2, G=7, B=11, E=4
        assert STANDARD.strings == [4, 9, 2, 7, 11, 4]

    def test_string_names(self):
        assert STANDARD.string_names == ["E", "A", "D", "G", "B", "e"]

    def test_slug(self):
        assert STANDARD.slug == "standard"


class TestGetTuning:
    def test_get_standard(self):
        t = get_tuning("standard")
        assert t is STANDARD

    def test_unknown_raises(self):
        try:
            get_tuning("drop_d")
            assert False, "Should have raised KeyError"
        except KeyError:
            pass


class TestTuningsRegistry:
    def test_standard_in_registry(self):
        assert "standard" in TUNINGS
