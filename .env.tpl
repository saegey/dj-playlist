# Non-secret config — committed values
POSTGRES_USER=djplaylist
POSTGRES_DB=djplaylist
DISCOGS_FOLDER_ID=0
APP_AUDIO_MOUNT=
WORKER_AUDIO_MOUNT=
APP_ALBUM_COVERS_SRC=
WORKER_ALBUM_COVERS_SRC=
ANALYTICS_PROVIDER=posthog
POSTHOG_HOST=https://us.i.posthog.com
JOB_TTL_ACTIVE_SECONDS=604800
JOB_TTL_TERMINAL_SECONDS=259200
PLAY_DETECTIONS_RETENTION_DAYS=30

# Vinyl play tracking (#281). `stub` matches nothing and stores null
# fingerprints — it exists to exercise the pipeline, not to run it.
FINGERPRINT_MATCHER=chromaprint
# Bit error rate above which a candidate is discarded. Measured on the #271
# corpus: true matches ran 0.02-0.25, the lowest false candidate sat at 0.298,
# and this produced zero false positives over 788 held-out queries.
FINGERPRINT_MAX_BER=0.25
# The recipe stored fingerprints are written under — NOT libchromaprint's
# version. Bump only when the fingerprint recipe itself changes; doing so
# invalidates the index until it is rebuilt.
FINGERPRINT_VERSION=1
# How long a chunk may sit un-claimed or in-flight before it is written off as
# failed so its file can be released.
AUDIO_INGEST_STALL_MINUTES=10
BACKUP_HEALTH_MAX_AGE_HOURS=30
ENABLE_DEVELOPER_TOOLS=true
# Static Storybook served same-origin by the app (see docker-compose.prod.yml).
# Build it with `just build-storybook` before deploying.
STORYBOOK_URL=/storybook/index.html

# Secrets from 1Password. Export GROOVENET_OP_* overrides before invoking op;
# leave them unset (not empty) to use defaults. See .env.example for item fields.
POSTGRES_PASSWORD=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/POSTGRES_PASSWORD
DATABASE_URL=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/DATABASE_URL
OPENAI_API_KEY=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/OPENAI_API_KEY
APPLE_MUSIC_TEAM_ID=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/APPLE_MUSIC_TEAM_ID
APPLE_MUSIC_KEY_ID=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/APPLE_MUSIC_KEY_ID
APPLE_MUSIC_PRIVATE_KEY=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/APPLE_MUSIC_PRIVATE_KEY
DISCOGS_USER_TOKEN=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/DISCOGS_USER_TOKEN
DISCOGS_USERNAME=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/DISCOGS_USERNAME
YOUTUBE_API_KEY=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/YOUTUBE_API_KEY
POSTHOG_KEY=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/NEXT_PUBLIC_POSTHOG_KEY
RESTIC_REPOSITORY=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/RESTIC_REPOSITORY
RESTIC_PASSWORD=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/RESTIC_PASSWORD
B2_ACCOUNT_ID=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/B2_ACCOUNT_ID
B2_ACCOUNT_KEY=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_ITEM:-groovenet}/B2_ACCOUNT_KEY

# Live now-playing over MQTT (#465); see .env.example for what each setting does.
MQTT_URL=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_MQTT_ITEM:-MQTT}/host
MQTT_USERNAME=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_MQTT_ITEM:-MQTT}/username
MQTT_PASSWORD=op://${GROOVENET_OP_VAULT:-Homelab}/${GROOVENET_OP_MQTT_ITEM:-MQTT}/password
MQTT_TOPIC_PREFIX=groovenet/now_playing
NOW_PLAYING_CLEAR_SECONDS=60
MQTT_HA_DISCOVERY=true
