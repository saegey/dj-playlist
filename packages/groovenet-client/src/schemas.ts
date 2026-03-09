// Subset of Zod schemas relevant to external consumers.
// Copied from my-collection-search/src/api-contract/schemas.ts — Next.js app is source of truth.

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

export type PlaylistTrackInput = z.infer<typeof playlistTrackInputSchema>;

export const trackEntitySchema = z
  .object({
    track_id: z.string(),
    friend_id: z.number().int(),
    title: z.string(),
    artist: z.string(),
    album: z.string(),
    year: z.union([z.string(), z.number()]).nullable().optional(),
    duration: z.string().optional(),
    duration_seconds: z.number().nullable().optional(),
    position: z.union([z.string(), z.number()]).optional(),
    release_id: z.string().nullable().optional(),
    library_identifier: z.string().nullable().optional(),
  })
  .passthrough();

export const trackSearchGetQuerySchema = z.object({
  q: z.string().optional().default(""),
  limit: nonNegativeIntFromInputSchema.optional().default(20),
  offset: nonNegativeIntFromInputSchema.optional().default(0),
  filter: z.string().optional(),
});

export const trackSearchGetResponseSchema = z.object({
  estimatedTotalHits: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
  processingTimeMs: z.number().int(),
  hits: z.array(z.unknown()),
});

export const playlistGeneticBodySchema = z.object({
  playlist: z
    .array(
      z
        .object({
          track_id: z.string().min(1),
          friend_id: z.number().int().optional(),
          bpm: z.union([z.number(), z.string()]).nullable().optional(),
          embedding: z
            .union([z.string(), z.array(z.number())])
            .nullable()
            .optional(),
        })
        .passthrough()
    )
    .min(1),
});

export const playlistGeneticResponseSchema = z
  .object({
    result: z.union([
      z.array(z.object({ track_id: z.string().min(1) }).passthrough()),
      z.record(z.object({ track_id: z.string().min(1) }).passthrough()),
    ]),
  })
  .passthrough();

export const jobInfoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    state: z.enum(["waiting", "active", "completed", "failed"]),
    progress: z.number(),
    data: z.object({}).passthrough(),
    returnvalue: z.unknown().optional(),
    finishedOn: z.number().optional(),
    failedReason: z.string().optional(),
    attemptsMade: z.number().int(),
    processedOn: z.number().optional(),
    queue: z.string(),
  })
  .passthrough();

export const localPlaybackControlBodySchema = z.object({
  action: z.enum(["play", "pause", "resume", "stop", "seek", "volume"]),
  filename: z.string().optional(),
  seconds: z.number().optional(),
  volume: z.number().optional(),
});

export const localPlaybackControlResponseSchema = z.object({
  success: z.boolean(),
  status: z.unknown().optional(),
  volume: z.number().optional(),
});

export const localPlaybackStatusResponseSchema = z.object({
  enabled: z.boolean(),
  status: z.unknown(),
});
