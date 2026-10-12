# essentia-api

FastAPI wrapper around the Essentia audio analysis library. Stateless.

Listens on **:8001**. Called by `download-worker` after a download completes;
nothing else talks to it.

## API

| | |
| --- | --- |
| `GET /health` | liveness |
| `POST /analyze` | analyse one audio file |

The request carries a `filename` that is a **URL the service fetches**, not a
local path — Essentia has no access to the shared audio volume, so the worker
converts the track to WAV, drops it in `AUDIO_DIR` (which the app serves), and
passes the app URL.

The response carries `rhythm` (BPM, danceability), `tonal` (key) and `metadata`
(length). Callers should treat a 200 carrying `error` or `detail` as a failure —
older builds return that instead of a non-2xx status, and `track_api.py` in the
worker checks for it explicitly.

### Key detection (#524)

`tonal` carries **three independent key estimates** — `key_krumhansl`,
`key_temperley` and `key_edma` — each `{ key, scale, strength }` — plus a
fourth, differently derived one from chord detection: `chords_key`/
`chords_scale`, flat strings with no `strength`. Only `key_edma` (tuned for
electronic/dance music) is stored, as `key`; its `strength` (0–1 confidence)
is stored alongside it as `key_confidence`, and callers log a warning (never
fail) when any of the other three disagree with it — see
`extractKeyAnalysis`/`logKeyProfileDisagreement` in
`my-collection-search/src/lib/essentiaKey.ts` and the equivalent
`download-worker/worker/essentia_key.py`.

The track that prompted #524 (reported F major, tunebat/songbpm said C
major — a fourth apart, sharing 6 of 7 notes, a known confusion point for
key detection) turned out *not* to be a disagreement between the three key
profiles: `key_edma`/`key_krumhansl`/`key_temperley` all agreed on F major
(strengths ~0.68–0.70). The actual split was against `chords_key`, which said
C major. Checking only the three profiles would have stayed silent on
exactly the track that motivated this — which is why `chords_key` is
checked too.

### profile.yaml

`/etc/essentia/profile.yaml`, baked into the `ghcr.io/mgoltzsche/essentia` base
image, isn't visible from this repo. Its actual contents (extracted by running
`essentia_streaming_extractor_music` inside the built image):

```yaml
chromaprint:
  compute: 0
highlevel:
  compute: 1
  svm_models: [... beta5 SVM models for mood/genre/danceability ...]
lowlevel:
  frameSize: 2048
  hopSize: 1024
outputFormat: json
outputFrames: 0
```

There is no `tonal` section, so key/HPCP extraction (frame size, HPCP
bin count, profile type per key estimator) runs on
`essentia_streaming_extractor_music`'s own built-in defaults, not a tuning
choice made in this repo. Re-extract after bumping the base image to check
this hasn't changed:

```bash
docker run --rm --entrypoint cat ghcr.io/public-vinyl-radio/essentia-api:<tag> /etc/essentia/profile.yaml
```

## Gotchas

- The Docker image is large and slow to build; `just rebuild-containers` takes a
  while when it is in the list.
- Analysis is CPU-bound and single-file; there is no batching endpoint.
- The worker strips video streams (`ffmpeg -vn`) before sending, because
  embedded cover art trips up the extractor on some files.
