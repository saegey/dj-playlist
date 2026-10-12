from worker.essentia_key import extract_key_analysis, log_key_profile_disagreement


class TestExtractKeyAnalysis:
    def test_formats_the_edma_key_and_rounds_its_strength(self):
        key, confidence = extract_key_analysis(
            {"key_edma": {"key": "C", "scale": "major", "strength": 0.6177087426190001}}
        )
        assert key == "C major"
        assert confidence == 0.618

    def test_returns_nones_when_tonal_is_missing(self):
        assert extract_key_analysis(None) == (None, None)

    def test_returns_a_none_key_when_key_edma_has_no_key_or_scale(self):
        key, confidence = extract_key_analysis({"key_edma": {"strength": 0.5}})
        assert key is None
        assert confidence == 0.5

    def test_returns_a_none_confidence_when_key_edma_has_no_strength(self):
        key, confidence = extract_key_analysis({"key_edma": {"key": "D", "scale": "minor"}})
        assert key == "D minor"
        assert confidence is None


class TestLogKeyProfileDisagreement:
    def test_logs_nothing_when_every_estimate_agrees(self, caplog):
        log_key_profile_disagreement(
            {
                "key_edma": {"key": "D", "scale": "minor"},
                "key_krumhansl": {"key": "D", "scale": "minor"},
                "key_temperley": {"key": "D", "scale": "minor"},
                "chords_key": "D",
                "chords_scale": "minor",
            },
            "trk_001",
            1,
        )
        assert "disagreement" not in caplog.text

    def test_logs_a_chords_key_disagreement_even_when_all_three_profiles_agree(self, caplog):
        """The real track behind #524: key_edma/krumhansl/temperley all said F
        major (strengths ~0.68-0.70); only chords_key said C major, matching
        tunebat/songbpm. The three-profile check alone misses this."""
        log_key_profile_disagreement(
            {
                "key_edma": {"key": "F", "scale": "major", "strength": 0.704965293407},
                "key_krumhansl": {"key": "F", "scale": "major", "strength": 0.695810675621},
                "key_temperley": {"key": "F", "scale": "major", "strength": 0.680185735226},
                "chords_key": "C",
                "chords_scale": "major",
            },
            "trk_001",
            1,
        )
        assert "stored edma=F major" in caplog.text
        assert "krumhansl=" not in caplog.text
        assert "temperley=" not in caplog.text
        assert "chords=C major" in caplog.text

    def test_ignores_a_partial_chords_estimate_missing_scale(self, caplog):
        log_key_profile_disagreement(
            {"key_edma": {"key": "F", "scale": "major"}, "chords_key": "C"},
            "trk_001",
            1,
        )
        assert caplog.text == ""

    def test_logs_the_f_c_major_confusion_that_prompted_524(self, caplog):
        log_key_profile_disagreement(
            {
                "key_edma": {"key": "F", "scale": "major"},
                "key_krumhansl": {"key": "C", "scale": "major"},
                "key_temperley": {"key": "C", "scale": "major"},
            },
            "trk_001",
            1,
        )
        assert "trk_001" in caplog.text
        assert "stored edma=F major" in caplog.text
        assert "krumhansl=C major" in caplog.text
        assert "temperley=C major" in caplog.text

    def test_logs_only_the_profile_that_actually_disagrees(self, caplog):
        log_key_profile_disagreement(
            {
                "key_edma": {"key": "F", "scale": "major"},
                "key_krumhansl": {"key": "F", "scale": "major"},
                "key_temperley": {"key": "C", "scale": "major"},
            },
            "trk_001",
            1,
        )
        assert "krumhansl=" not in caplog.text
        assert "temperley=C major" in caplog.text

    def test_does_nothing_when_there_is_no_stored_edma_key(self, caplog):
        log_key_profile_disagreement(
            {"key_krumhansl": {"key": "C", "scale": "major"}}, "trk_001", 1
        )
        assert caplog.text == ""

    def test_does_nothing_when_tonal_is_missing(self, caplog):
        log_key_profile_disagreement(None, "trk_001", 1)
        assert caplog.text == ""
