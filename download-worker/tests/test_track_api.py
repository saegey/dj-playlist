from unittest.mock import patch

import pytest


class TestUpdateTrackAnalysis:
    @patch("groovenet_client.GroovenetClient.update_track")
    def test_updates_extracted_essentia_fields(self, mock_patch):
        from worker.track_api import update_track_analysis

        mock_patch.return_value.ok = True

        update_track_analysis(
            "track-1",
            7,
            {
                "rhythm": {"bpm": 123.6, "danceability": 0.81234},
                "tonal": {"key_edma": {"key": "C", "scale": "major", "strength": 0.6177}},
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

        body = mock_patch.call_args.args[0]
        assert body["bpm"] == 124
        assert "bpm_confidence" not in body
        assert body["key"] == "C major"
        assert body["key_confidence"] == 0.618
        assert body["danceability"] == 0.812
        assert body["duration_seconds"] == 245
        assert body["mood_happy"] == 0.123
        assert body["mood_sad"] == 0.235
        assert body["mood_relaxed"] == 0.346
        assert body["mood_aggressive"] == 0.457
        assert body["year"] == "1999"

    @patch("groovenet_client.GroovenetClient.update_track")
    def test_sends_bpm_confidence_from_the_beat_histogram(self, mock_patch):
        """#531: the histogram was discarded, so a contested tempo looked as sure as a clear one."""
        from worker.track_api import update_track_analysis

        update_track_analysis(
            "track-1",
            7,
            {
                "rhythm": {
                    "bpm": 103.483299255,
                    "bpm_histogram_first_peak_weight": 0.282122910023,
                    "bpm_histogram_second_peak_weight": 0.0241286866367,
                },
            },
        )

        body = mock_patch.call_args.args[0]
        assert body["bpm"] == 103
        assert body["bpm_confidence"] == 0.258

    @patch("groovenet_client.GroovenetClient.update_track")
    def test_omits_bpm_confidence_when_there_is_no_bpm(self, mock_patch):
        from worker.track_api import update_track_analysis

        update_track_analysis(
            "track-1",
            7,
            {"rhythm": {"danceability": 0.5, "bpm_histogram_first_peak_weight": 0.4}},
        )

        body = mock_patch.call_args.args[0]
        assert "bpm" not in body
        assert "bpm_confidence" not in body

    @patch("groovenet_client.GroovenetClient.update_track")
    def test_consensus_overrides_a_minority_edma_and_logs_its_disagreement(self, mock_patch, caplog):
        """Regression: #524 — key_krumhansl/key_temperley were computed and discarded
        silently, so edma's minority answer was stored and trusted as fact."""
        from worker.track_api import update_track_analysis

        mock_patch.return_value.ok = True

        update_track_analysis(
            "track-1",
            7,
            {
                "tonal": {
                    "key_edma": {"key": "F", "scale": "major", "strength": 0.62},
                    "key_krumhansl": {"key": "C", "scale": "major", "strength": 0.58},
                    "key_temperley": {"key": "C", "scale": "major", "strength": 0.55},
                },
            },
        )

        body = mock_patch.call_args.args[0]
        assert body["key"] == "C major"
        assert body["key_confidence"] == 0.565
        assert "stored key=C major" in caplog.text
        assert "edma=F major" in caplog.text


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


class TestAppIdentification:
    def test_client_names_the_worker_and_reuses_session(self):
        from worker.app_api import get_groovenet_client

        client = get_groovenet_client()
        assert client.headers == {"X-Groovenet-Client": "worker"}
        assert get_groovenet_client() is client


class TestReportJobOutcome:
    @patch("groovenet_client.GroovenetClient.report_job_outcome")
    def test_posts_after_terminal_status_with_short_timeout(self, mock_report):
        from worker.track_api import report_job_outcome

        report_job_outcome("job-1")
        mock_report.assert_called_once_with("job-1", timeout=10)

    @pytest.mark.parametrize("error", [ConnectionError("app down"), RuntimeError("rejected")])
    def test_failure_is_only_logged(self, error, caplog):
        from worker.track_api import report_job_outcome

        with patch("groovenet_client.GroovenetClient.report_job_outcome", side_effect=error):
            report_job_outcome("job-1")
        assert "outcome report failed" in caplog.text


@pytest.mark.parametrize("status", [404, 500])
@pytest.mark.parametrize("operation", ["analysis", "duration", "artwork"])
def test_http_track_failures_propagate_and_never_log_success(monkeypatch, caplog, status, operation):
    """Regression: generated 404/500 models previously looked like success."""
    import io

    import requests
    from groovenet_client import GroovenetApiError
    from worker import track_api

    response = requests.Response()
    response.status_code = status
    response._content = b'{"error":"track update rejected"}'
    response.raw = io.BytesIO(response._content)
    monkeypatch.setattr(requests.Session, "request", lambda *a, **kw: response)
    with pytest.raises(GroovenetApiError) as caught:
        if operation == "analysis":
            track_api.update_track_analysis("t1", 7, {"rhythm": {"bpm": 120}})
        elif operation == "duration":
            track_api.update_track_duration("t1", 7, 245)
        else:
            track_api.update_track_album_art_url("t1", 7, "/cover.jpg")
    assert caught.value.status == status
    assert "updated with analysis data" not in caplog.text
