from unittest.mock import patch

import pytest


class TestUpdateTrackAnalysis:
    @patch("worker.track_api.patch_api_tracks.sync", return_value={"ok": True})
    def test_updates_extracted_essentia_fields(self, mock_patch):
        from worker.track_api import update_track_analysis

        update_track_analysis(
            "track-1",
            7,
            {
                "rhythm": {"bpm": 123.6, "danceability": 0.81234},
                "tonal": {"key_edma": {"key": "C", "scale": "major"}},
                "metadata": {"audio_properties": {"length": 245.2}},
                "highlevel": {
                    "mood_happy": {"all": {"happy": 0.12345}},
                    "mood_sad": {"all": {"sad": 0.23456}},
                    "mood_relaxed": {"all": {"relaxed": 0.34567}},
                    "mood_aggressive": {"all": {"aggressive": 0.45678}},
                },
            },
            audio_year=1999,
        )

        body = mock_patch.call_args.kwargs["body"]
        assert body["bpm"] == 124
        assert body["key"] == "C major"
        assert body["danceability"] == 0.812
        assert body["duration_seconds"] == 245
        assert body["mood_happy"] == 0.123
        assert body["mood_sad"] == 0.235
        assert body["mood_relaxed"] == 0.346
        assert body["mood_aggressive"] == 0.457
        assert body["year"] == "1999"


class TestAnalyzeAudioFile:
    @patch("worker.track_api.requests.post")
    @patch("worker.track_api.run_subprocess")
    @patch("worker.track_api.os.path.getsize", return_value=100)
    @patch("worker.track_api.os.path.exists", return_value=True)
    @patch("worker.track_api.os.unlink")
    def test_raises_on_json_error_payload(
        self,
        mock_unlink,
        mock_exists,
        mock_getsize,
        mock_run,
        mock_post,
    ):
        from worker.track_api import analyze_audio_file

        mock_run.return_value.returncode = 0
        mock_run.return_value.stderr = ""
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {"error": "Invalid or disallowed URL"}

        with pytest.raises(Exception, match="Invalid or disallowed URL"):
            analyze_audio_file("/app/audio/track-1.m4a", "track-1", 1)
