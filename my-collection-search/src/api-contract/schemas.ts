import { z } from "zod";

const toInt = (value: unknown): unknown => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return value;
};

export const intFromInputSchema = z.preprocess(toInt, z.number().int());
export const nonNegativeIntFromInputSchema = z.preprocess(
  toInt,
  z.number().int().min(0)
);

export const apiErrorSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .passthrough();

export const playlistTrackRefSchema = z.object({
  track_id: z.string(),
  friend_id: z.number().int().nullable().optional(),
  position: z.number().int().optional(),
});

export const playlistTrackInputSchema = z
  .object({
    track_id: z.string(),
    friend_id: z.number().int().optional(),
    username: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    artist: z.string().nullable().optional(),
    album: z.string().nullable().optional(),
    year: z.union([z.string(), z.number()]).nullable().optional(),
    styles: z.array(z.string()).nullable().optional(),
    genres: z.array(z.string()).nullable().optional(),
    duration: z.string().nullable().optional(),
    duration_seconds: z.number().nullable().optional(),
    position: z.number().int().nullable().optional(),
    discogs_url: z.string().nullable().optional(),
    apple_music_url: z.string().nullable().optional(),
    youtube_url: z.string().nullable().optional(),
    spotify_url: z.string().nullable().optional(),
    soundcloud_url: z.string().nullable().optional(),
    album_thumbnail: z.string().nullable().optional(),
    local_tags: z.string().nullable().optional(),
    bpm: z.union([z.number(), z.string()]).nullable().optional(),
    key: z.string().nullable().optional(),
    danceability: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
    star_rating: z.number().nullable().optional(),
    release_id: z.string().nullable().optional(),
    mood_happy: z.number().nullable().optional(),
    mood_sad: z.number().nullable().optional(),
    mood_relaxed: z.number().nullable().optional(),
    mood_aggressive: z.number().nullable().optional(),
    local_audio_url: z.string().nullable().optional(),
  })
  .passthrough();

export const playlistSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    created_at: z.string(),
    tracks: z.array(playlistTrackRefSchema),
  })
  .passthrough();

export const playlistCreateBodySchema = z
  .object({
    name: z.string(),
    tracks: z.array(playlistTrackInputSchema).optional().default([]),
    default_friend_id: z.number().int().optional(),
  })
  .passthrough();

export const playlistPatchBodySchema = z
  .object({
    id: intFromInputSchema,
    name: z.string().optional(),
    tracks: z
      .array(z.union([z.string(), playlistTrackInputSchema]))
      .optional(),
    default_friend_id: z.number().int().optional(),
  })
  .passthrough();

export const playlistDeleteQuerySchema = z.object({
  id: intFromInputSchema,
});

export const playlistDetailParamsSchema = z.object({
  id: intFromInputSchema,
});

export const playlistDetailResponseSchema = z.object({
  playlist_id: z.number().int(),
  playlist_name: z.string().nullable().optional(),
  tracks: z.array(playlistTrackRefSchema),
});

export const trackSearchGetQuerySchema = z.object({
  q: z.string().optional().default(""),
  limit: nonNegativeIntFromInputSchema.optional().default(20),
  offset: nonNegativeIntFromInputSchema.optional().default(0),
  filter: z.string().optional(),
});

export const trackSearchPostBodySchema = z.object({
  query: z.string().optional().default(""),
  limit: nonNegativeIntFromInputSchema.optional().default(20),
  offset: nonNegativeIntFromInputSchema.optional().default(0),
  filters: z
    .object({
      bpm_min: z.number().optional(),
      bpm_max: z.number().optional(),
      key: z.string().optional(),
      star_rating: z.number().optional(),
      friend_id: z.number().int().optional(),
    })
    .optional(),
});

const meiliSearchMetaSchema = z.object({
  estimatedTotalHits: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
  processingTimeMs: z.number().int(),
});

export const trackSearchGetResponseSchema = meiliSearchMetaSchema.extend({
  hits: z.array(z.unknown()),
});

export const trackSearchPostResponseSchema = meiliSearchMetaSchema.extend({
  tracks: z.array(z.unknown()),
});

export const recommendationsQuerySchema = z.object({
  track_id: z.string().min(1),
  friend_id: intFromInputSchema,
  limit_identity: intFromInputSchema.optional().default(200),
  limit_audio: intFromInputSchema.optional().default(200),
  ivfflat_probes: intFromInputSchema.optional().default(10),
});

export const seedEmbeddingsSchema = z.object({
  identity: z.boolean(),
  audio: z.boolean(),
});

export const recommendationCandidateSchema = z.object({
  trackId: z.string(),
  friendId: z.number().int(),
  simIdentity: z.number().nullable(),
  simAudio: z.number().nullable(),
  metadata: z
    .object({
      bpm: z.number().nullable(),
      key: z.string().nullable(),
      keyConfidence: z.number().nullable(),
      tempoConfidence: z.number().nullable(),
      eraBucket: z.string().nullable(),
      tags: z.array(z.string()),
      styles: z.array(z.string()),
      energy: z.number().nullable(),
      danceability: z.number().nullable(),
      title: z.string(),
      artist: z.string(),
      album: z.string(),
      year: z.string().nullable(),
      genres: z.array(z.string()),
      starRating: z.number().nullable(),
      moodHappy: z.number().nullable(),
      moodSad: z.number().nullable(),
      moodRelaxed: z.number().nullable(),
      moodAggressive: z.number().nullable(),
    })
    .passthrough(),
});

export const recommendationsResponseSchema = z.object({
  seedTrackId: z.string(),
  seedFriendId: z.number().int(),
  seedEmbeddings: seedEmbeddingsSchema,
  candidates: z.array(recommendationCandidateSchema),
  stats: z.object({
    identityCount: z.number().int(),
    audioCount: z.number().int(),
    unionCount: z.number().int(),
    timingMs: z.object({
      identityQuery: z.number().int(),
      audioQuery: z.number().int(),
      total: z.number().int(),
    }),
  }),
});

export const manifestVerificationResultSchema = z.object({
  username: z.string(),
  totalReleaseIds: z.number().int(),
  missingFiles: z.array(z.string()),
  validFiles: z.array(z.string()),
});

export const manifestVerificationResponseSchema = z.object({
  message: z.string(),
  results: z.array(manifestVerificationResultSchema),
  summary: z.object({
    totalManifests: z.number().int(),
    totalMissingFiles: z.number().int(),
    totalValidFiles: z.number().int(),
  }),
});

export const manifestCleanupResultSchema = z.object({
  username: z.string(),
  before: z.number().int(),
  after: z.number().int(),
  removed: z.array(z.string()),
});

export const manifestCleanupResponseSchema = z.object({
  message: z.string(),
  results: z.array(manifestCleanupResultSchema),
  summary: z.object({
    totalManifests: z.number().int(),
    totalRemoved: z.number().int(),
    totalKept: z.number().int(),
  }),
});
