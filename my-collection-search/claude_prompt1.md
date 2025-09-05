Perfect—this is enough to lock the spec. I’ll give you a single copy-paste “Claude Code” prompt tuned to your answers (magic-link auth, 5 MB uploads, unlisted UUID URLs, Netlify + Neon + S3/R2, single-activity QA, UTC/metric, keep raw FIT with capped datapoints). Then a tight next-steps checklist.

⸻

Prompt for Claude Code (copy-paste as one message)

Title: Build “fitnow” prototype — FIT upload → parse → metrics → public API → single-activity QA → MCP tools

You are a senior full-stack engineer. Generate a working prototype per the spec below. Favor simplicity and shipping speed.

Stack
	•	Hosting: Netlify (Edge not required).
	•	Auth: Netlify Identity (magic-link via GoTrue).
	•	Frontend: React + Vite + TypeScript; minimal UI (dropzone, activity page, share toggle).
	•	Functions: Netlify Functions (TypeScript) + one Go function wrapping an existing FIT parser.
	•	DB: Neon Postgres (pg), SQL migrations.
	•	Storage: S3-compatible (Cloudflare R2 or AWS S3) for raw .fit and downsampled stream blobs.
	•	AI: /api/ask endpoint with intent matcher over a single activity (no cross-activity yet).
	•	MCP: Dev-time tool manifest calling the REST API.

Product rules (from user answers)
	•	Sign-in with magic link required to upload (prevents bot spam).
	•	One file per upload, max 5 MB.
	•	Unlisted by default, share via UUID URL; explicitly set robots: noindex.
	•	Public read for unlisted/public activities; no API key required for read routes.
	•	Keep raw FIT in storage. Provide zoomable data by serving capped/downsampled streams.
	•	Store everything in UTC and metric; frontend may convert to local/imperial.
	•	Name/slug: fitnow.
	•	Design so adding cross-activity queries later is straightforward.

Data model & migrations (001_init.sql)

create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz default now()
);

create table activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  title text,
  started_at timestamptz,
  elapsed_seconds int,
  moving_seconds int,
  distance_m double precision,
  elev_gain_m double precision,
  avg_speed_mps double precision,
  max_speed_mps double precision,
  avg_power_w double precision,
  np_w double precision,
  avg_hr_bpm double precision,
  max_hr_bpm double precision,
  avg_cadence_rpm double precision,
  calories double precision,
  device text,
  visibility text not null default 'unlisted' check (visibility in ('public','unlisted','private')),
  raw_storage_key text not null,       -- path to .fit
  streams_storage_key text,            -- optional JSON blob for downsampled arrays
  best_durations jsonb,                -- { "1s": 900, "2s": 880, ..., "1h": 300 }
  created_at timestamptz default now()
);

create table laps (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid references activities(id) on delete cascade,
  idx int,
  start_offset_s int,
  elapsed_s int,
  distance_m double precision,
  avg_power_w double precision,
  avg_speed_mps double precision,
  avg_hr_bpm double precision,
  elev_gain_m double precision
);

create index on activities(visibility);
create index on activities(user_id);

Storage layout
	•	Raw FIT: fitnow/{user_id}/{activity_id}.fit
	•	Downsampled streams JSON: fitnow/{user_id}/{activity_id}.streams.json

Go parser function (Netlify function name: parse-fit)
	•	Input (JSON):

{ "signed_url": "https://…/activity.fit" }

	•	Behavior:
	•	Download FIT from signed_url.
	•	Use existing Go parser code (user has a CLI); refactor into a lib called by the function.
	•	Compute totals and best power durations with your exponential-ish series:
	•	1s, 2s, 3s, 5s, 10s, 30s, 60s, 2m, 3m, 4m, 5m, 10m, 30m, 1h, 2h (omit ones not computable).
	•	Produce downsampled streams (≤1000 points per kind): time_s, power_w, hr_bpm, speed_mps, elev_m.
	•	Output (JSON contract):

{
  "meta": { "started_at": "2025-08-01T14:23:11Z", "device": "Edge 540" },
  "totals": {
    "elapsed_seconds": 7245, "moving_seconds": 7030, "distance_m": 87321.4, "elev_gain_m": 1120.5,
    "avg_speed_mps": 12.4, "max_speed_mps": 24.1, "avg_power_w": 218.3, "np_w": 235.1,
    "avg_hr_bpm": 143.2, "max_hr_bpm": 178, "avg_cadence_rpm": 83.5, "calories": 1820.0
  },
  "best_durations": { "1s": 950, "5s": 780, "1m": 420, "20m": null, "1h": null },
  "laps": [
    { "idx": 0, "start_offset_s": 0, "elapsed_s": 1200, "distance_m": 5600.2,
      "avg_power_w": 210.5, "avg_speed_mps": 11.8, "avg_hr_bpm": 138.1, "elev_gain_m": 80.0 }
  ],
  "streams": {
    "time_s": [0, 5, 10],
    "power_w": [0, 210, 220],
    "hr_bpm": [90, 120, 130],
    "speed_mps": [0, 8.1, 9.2],
    "elev_m": [5.2, 5.3, 5.1]
  }
}

	•	Notes: return 400 on invalid FIT; it’s okay if some fields are null.

HTTP API (public read, auth required for write)
	•	POST /api/activities (auth required)
	•	multipart: file (<=5 MB, .fit).
	•	Flow: put raw FIT → create signed GET → call parse-fit → validate JSON → insert into DB → upload downsampled streams JSON → return { id, share_url }.
	•	GET /api/activities/:id (public if unlisted/public)
	•	Returns activity row + minimal embedded metrics (no huge arrays).
	•	GET /api/activities/:id/streams (public if allowed)
	•	Returns the downsampled JSON (cap ≤1000 points).
	•	GET /api/activities/:id/summary (public)
	•	Returns a human summary (distance, moving time, elev, avg power/NP, avg HR, key best durations available).
	•	PATCH /api/activities/:id/visibility (auth: owner)
	•	{ visibility: "public" | "unlisted" | "private" }.

AI /api/ask (single-activity QA)
	•	Input: { activity_id: string, question: string }
	•	MVP intents (exact string/regex/keyword heuristic → SQL or JSON compute):
	1.	Average power (overall / last X minutes / final climb)
	2.	Moving time / elapsed time
	3.	Distance / elevation gain
	4.	Average / max HR
	5.	Best power durations (e.g., “best 1-minute power”)
	•	Final climb heuristic (v1):
	•	Use streams.elev_m and time_s; find the last contiguous segment where net gain ≥ 50 m and average grade ≥ 3% over ≥ 5 min (tunable). Average power = mean over that index range. If no streams, fallback to last lap.
	•	Response: { answer: string, data?: any } (e.g., numerical result + brief sentence).

Frontend pages
	•	/ (authenticated):
	•	Dropzone, upload status; list the user’s latest activities (title, date, chips for key metrics).
	•	/a/:id (public/unlisted):
	•	Title + headline metrics (distance, moving time, elev gain, avg power, NP, avg HR).
	•	Three small charts from downsampled streams.
	•	“Share” toggle (if owner, show visibility control).
	•	“Ask” box calling /api/ask with a few quick-question buttons.
	•	SEO: add <meta name="robots" content="noindex,nofollow"> for unlisted pages.

Env/config
	•	DATABASE_URL
	•	STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY
	•	PUBLIC_BASE_URL
	•	NETLIFY_IDENTITY_URL (GoTrue)
	•	Upload limit enforcement (5 MB) at both client and function.
	•	Generate signed GET (time-limited) when calling parse-fit.

Security & abuse guards
	•	Require auth for POST /api/activities.
	•	Rate-limit uploads per user (e.g., 10/day).
	•	MIME/extension check + size guard; store hash to dedup.
	•	Unlisted by default; no directory listing; CORS narrow to site origin.

Tests
	•	Unit test the intent matcher for /api/ask.
	•	E2E: upload a sample FIT → parse → GET activity → GET streams → ask “What was my average power on the final climb?”

MCP tools (dev-time; mcp.json)

{
  "name": "fitnow-mcp",
  "version": "0.1.0",
  "tools": [
    {
      "name": "get_activity",
      "description": "Fetch an activity by id",
      "input_schema": { "type":"object","properties":{"id":{"type":"string"}},"required":["id"] }
    },
    {
      "name": "get_streams",
      "description": "Fetch downsampled streams for an activity",
      "input_schema": { "type":"object","properties":{"id":{"type":"string"}},"required":["id"] }
    },
    {
      "name": "query_best_duration",
      "description": "Return best power for a named duration (e.g., 1m, 5m, 20m, 1h)",
      "input_schema": {
        "type":"object",
        "properties":{"id":{"type":"string"},"duration":{"type":"string"}},
        "required":["id","duration"]
      }
    },
    {
      "name": "compute_summary",
      "description": "Generate a human summary for an activity",
      "input_schema": { "type":"object","properties":{"id":{"type":"string"}},"required":["id"] }
    }
  ]
}

Implement each tool by calling the REST API so Claude (as an agent) can test the app.

Developer UX
	•	Scripts:
	•	npm run dev (Vite + Netlify functions + DB)
	•	netlify dev with Identity enabled
	•	npm run migrate (apply SQL)
	•	Seed: include 1–2 sample FITs behind a local flag.

Deliver the full repo with:
	•	README.md (setup, env, local dev, deploy, OpenAPI snippet)
	•	Netlify config (netlify.toml)
	•	Functions code (TS + Go), SQL migrations, MCP manifest, minimal UI

⸻

Next steps (for you, Adam)
	1.	Create Neon DB; grab DATABASE_URL.
	2.	Create an S3/R2 bucket and keys; set the 5 MB object limit policy if available.
	3.	Enable Netlify Identity (magic link) for the site; note the Identity endpoint.
	4.	Give Claude this prompt exactly as-is.
	5.	Drop your Go parser code into the parse-fit function (match the JSON contract).
	6.	Test with two FIT files; verify /api/ask answers “final climb” and “best 1-minute power.”

If you want, I can also hand you a tiny helper package for downsampling and the final climb heuristic in TS to keep behavior consistent between Go/TS.