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

export const discogsLookupQuerySchema = z.object({
  track_id: z.string().min(1),
  username: z.string().optional(),
  friend_id: intFromInputSchema.optional(),
});

export const discogsLookupTrackSchema = z
  .object({
    position: z.string(),
    title: z.string(),
    duration: z.string(),
    artists: z.array(z.object({ name: z.string() })).optional(),
  })
  .passthrough();

export const discogsLookupReleaseSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    artists: z.array(z.object({ name: z.string() })).optional(),
    artists_sort: z.string().optional(),
    year: z.number().nullable().optional(),
    styles: z.array(z.string()).optional(),
    genres: z.array(z.string()).optional(),
    uri: z.string().nullable().optional(),
    thumb: z.string().nullable().optional(),
    videos: z.array(z.object({}).passthrough()).optional(),
    video: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough();

export const discogsLookupResponseSchema = z
  .object({
    releaseId: z.string().optional(),
    filePath: z.string().optional(),
    release: discogsLookupReleaseSchema.nullable().optional(),
    matchedTrack: discogsLookupTrackSchema.nullable().optional(),
  })
  .passthrough();

export const localPlaybackActionSchema = z.enum([
  "play",
  "pause",
  "resume",
  "stop",
  "seek",
  "volume",
]);

export const localPlaybackControlBodySchema = z.object({
  action: localPlaybackActionSchema,
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

export const localPlaybackTestResponseSchema = z
  .object({
    available: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
    config: z
      .object({
        ENABLE_AUDIO_PLAYBACK: z.string().optional(),
        AUDIO_DEVICE: z.string().optional(),
        MPD_HOST: z.string().optional(),
        MPD_PORT: z.string().optional(),
        MPD_PATH_PREFIX: z.string().optional(),
      })
      .optional(),
    testResult: z.unknown().optional(),
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
export type PlaylistTrackInput = z.infer<typeof playlistTrackInputSchema>;

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

export const playlistGeneticTrackSchema = z
  .object({
    track_id: z.string().min(1),
    friend_id: z.number().int().optional(),
    bpm: z.union([z.number(), z.string()]).nullable().optional(),
    embedding: z.union([z.string(), z.array(z.number())]).nullable().optional(),
    _vectors: z
      .object({
        default: z.array(z.number()).optional(),
      })
      .optional(),
  })
  .passthrough();

export const playlistGeneticBodySchema = z.object({
  playlist: z.array(playlistGeneticTrackSchema).min(1),
});

export const playlistGeneticResultTrackSchema = z
  .object({
    track_id: z.string().min(1),
  })
  .passthrough();

export const playlistGeneticResponseSchema = z
  .object({
    result: z.union([
      z.array(playlistGeneticResultTrackSchema),
      z.record(playlistGeneticResultTrackSchema),
    ]),
  })
  .passthrough();

export const playlistGeneticInvalidItemSchema = z.object({
  track_id: z.string().optional(),
  reason: z.string(),
});

export const playlistGeneticValidationErrorSchema = z.object({
  error: z.string(),
  invalid: z.array(playlistGeneticInvalidItemSchema),
  invalid_count: z.number().int(),
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

export const trackPlaylistCountRefSchema = z.object({
  track_id: z.string().min(1),
  friend_id: z.number().int(),
});

export const trackPlaylistCountsBodySchema = z.object({
  track_refs: z.array(trackPlaylistCountRefSchema),
});

export const trackPlaylistCountsResponseSchema = z.record(z.number().int());

export const trackPlaylistMembershipSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  position: z.number().int(),
});

export const trackPlaylistsResponseSchema = z.object({
  playlists: z.array(trackPlaylistMembershipSchema).optional(),
});

export const trackAudioMetadataEmbeddedCoverSchema = z
  .object({
    index: z.number().int(),
    codec_name: z.string().optional(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    pix_fmt: z.string().optional(),
  })
  .passthrough();

export const trackAudioMetadataResponseSchema = z.object({
  track_id: z.string(),
  friend_id: z.number().int(),
  local_audio_url: z.string(),
  audio_file_album_art_url: z.string().nullable().optional(),
  has_embedded_cover: z.boolean(),
  embedded_cover: trackAudioMetadataEmbeddedCoverSchema.nullable().optional(),
  probe: z.unknown(),
});

export const trackExtractEmbeddedCoverResponseSchema = z
  .object({
    success: z.boolean(),
    audio_file_album_art_url: z.string(),
    message: z.string(),
  })
  .passthrough();

export const trackEssentiaResponseSchema = z.object({
  track_id: z.string(),
  friend_id: z.number().int(),
  file_path: z.string(),
  data: z.unknown(),
});

export const trackEmbeddingPreviewResponseSchema = z.object({
  track_id: z.string(),
  friend_id: z.number().int(),
  isDefaultTemplate: z.boolean(),
  template: z.string(),
  prompt: z.string(),
});

export const embeddingPreviewTypeSchema = z.enum(["identity", "audio_vibe"]);

export const identityEmbeddingDataSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  era: z.string(),
  country: z.string(),
  labels: z.array(z.string()),
  composers: z.array(z.string()),
  genres: z.array(z.string()),
  styles: z.array(z.string()),
  tags: z.array(z.string()),
});

export const audioVibeEmbeddingDataSchema = z.object({
  bpm: z.string(),
  bpmRange: z.string(),
  key: z.string(),
  camelot: z.string(),
  danceability: z.string(),
  energy: z.string(),
  dominantMood: z.string(),
  moodProfile: z.string(),
  vibeDescriptors: z.array(z.string()),
  acoustic: z.string().optional(),
  vocalPresence: z.string().optional(),
  percussiveness: z.string().optional(),
  partyMood: z.string().optional(),
});

export const embeddingIdentityPreviewApiResponseSchema = z.object({
  type: z.literal("identity"),
  text: z.string(),
  data: identityEmbeddingDataSchema,
});

export const embeddingAudioVibePreviewApiResponseSchema = z.object({
  type: z.literal("audio_vibe"),
  text: z.string(),
  data: audioVibeEmbeddingDataSchema,
});

export const embeddingPreviewResponseSchema = z.discriminatedUnion("type", [
  embeddingIdentityPreviewApiResponseSchema,
  embeddingAudioVibePreviewApiResponseSchema,
]);

export const identityEmbeddingPreviewResponseSchema = z.object({
  identityText: z.string(),
  identityData: identityEmbeddingDataSchema,
});

export const audioVibeEmbeddingPreviewResponseSchema = z.object({
  vibeText: z.string(),
  vibeData: audioVibeEmbeddingDataSchema,
});

export const legacyEmbeddingPreviewResponseSchema = z.object({
  type: embeddingPreviewTypeSchema,
  text: z.string(),
  data: z.unknown(),
});

export const bulkNotesUpdateSchema = z
  .object({
    track_id: z.string().min(1),
    local_tags: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const bulkNotesBodySchema = z.object({
  updates: z.array(bulkNotesUpdateSchema),
});

export const bulkNotesResponseSchema = z
  .object({
    success: z.boolean(),
    updated: z.number().int().optional(),
    tracks: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough();

export const recommendationsQuerySchema = z.object({
  track_id: z.string().min(1),
  friend_id: intFromInputSchema,
  limit_identity: intFromInputSchema.optional().default(200),
  limit_audio: intFromInputSchema.optional().default(200),
  ivfflat_probes: intFromInputSchema.optional().default(10),
});

export const recommendationSeedTrackSchema = z.object({
  track_id: z.string().min(1),
  friend_id: intFromInputSchema,
});

export const recommendationsBatchBodySchema = z.object({
  tracks: z.array(recommendationSeedTrackSchema).min(1).max(100),
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

export const durationBackfillQueueErrorSchema = z.object({
  track_id: z.string(),
  error: z.string(),
});

export const durationBackfillResponseSchema = z.object({
  queued: z.number().int(),
  jobIds: z.array(z.string()),
  errors: z.array(durationBackfillQueueErrorSchema),
});

export const coverArtBackfillBodySchema = z.object({
  friend_id: intFromInputSchema.nullable().optional(),
});

export const coverArtBackfillQueueErrorSchema = z.object({
  track_id: z.string(),
  friend_id: z.number().int(),
  release_id: z.string().nullable(),
  error: z.string(),
});

export const coverArtBackfillResponseSchema = z.object({
  queued: z.number().int(),
  queuedAlbums: z.number().int(),
  tracksImpacted: z.number().int(),
  jobIds: z.array(z.string()),
  errors: z.array(coverArtBackfillQueueErrorSchema),
});

export const essentiaBackfillBodySchema = z.object({
  friend_id: intFromInputSchema.nullable().optional(),
  force: z.boolean().optional().default(false),
});

export const essentiaBackfillQueueErrorSchema = z.object({
  track_id: z.string(),
  friend_id: z.number().int(),
  error: z.string(),
});

export const essentiaBackfillResponseSchema = z.object({
  queued: z.number().int(),
  skipped_existing: z.number().int(),
  total_candidates: z.number().int(),
  force: z.boolean(),
  jobIds: z.array(z.string()),
  errors: z.array(essentiaBackfillQueueErrorSchema),
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

export const aiPromptSettingsQuerySchema = z.object({
  friend_id: intFromInputSchema.optional(),
});

export const aiPromptSettingsPutBodySchema = z.object({
  friend_id: intFromInputSchema,
  prompt: z.string().optional().default(""),
});

export const aiPromptSettingsGetResponseSchema = z.object({
  prompt: z.string(),
  defaultPrompt: z.string(),
  isDefault: z.boolean(),
});

export const aiPromptSettingsPutResponseSchema = z.object({
  prompt: z.string(),
  isDefault: z.boolean(),
});

export const embeddingPromptSettingsQuerySchema = z.object({
  friend_id: intFromInputSchema.optional(),
});

export const embeddingPromptSettingsPutBodySchema = z.object({
  friend_id: intFromInputSchema,
  template: z.string().optional().default(""),
});

export const embeddingPromptSettingsGetResponseSchema = z.object({
  template: z.string(),
  defaultTemplate: z.string(),
  isDefault: z.boolean(),
});

export const embeddingPromptSettingsPutResponseSchema = z.object({
  template: z.string(),
  isDefault: z.boolean(),
});

export const albumReleaseParamsSchema = z.object({
  releaseId: z.string().min(1),
});

export const albumFriendQuerySchema = z.object({
  friend_id: intFromInputSchema,
});

export const albumDiscogsRawResponseSchema = z.object({
  friend_id: z.number().int(),
  release_id: z.string(),
  username: z.string(),
  file_path: z.string(),
  data: z.unknown(),
});

export const albumEntitySchema = z
  .object({
    release_id: z.string(),
    friend_id: z.number().int(),
    title: z.string(),
    artist: z.string(),
    year: z.union([z.string(), z.number()]).nullable().optional(),
    genres: z.array(z.string()).optional(),
    styles: z.array(z.string()).optional(),
    album_thumbnail: z.string().nullable().optional(),
    track_count: z.number().int().optional(),
    date_added: z.string().optional(),
    date_changed: z.string().optional(),
    library_identifier: z.string().nullable().optional(),
  })
  .passthrough();

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

export const similarVibeQuerySchema = z.object({
  track_id: z.string().min(1),
  friend_id: intFromInputSchema,
  limit: intFromInputSchema.optional().default(50),
  ivfflat_probes: intFromInputSchema.optional().default(10),
});

export const similarVibeTrackSchema = trackEntitySchema.extend({
  distance: z.number(),
  identity_text: z.string(),
  danceability: z.union([z.number(), z.string()]).nullable().optional(),
  mood_happy: z.number().nullable().optional(),
  mood_sad: z.number().nullable().optional(),
  mood_relaxed: z.number().nullable().optional(),
  mood_aggressive: z.number().nullable().optional(),
});

export const similarVibeResponseSchema = z.object({
  source_track_id: z.string(),
  source_friend_id: z.number().int(),
  count: z.number().int(),
  tracks: z.array(similarVibeTrackSchema),
});

export const albumCreateResponseSchema = z.object({
  album: albumEntitySchema,
  tracks: z.array(trackEntitySchema),
});

export const queueAlbumDownloadsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  jobIds: z.array(z.string()),
  tracksQueued: z.number().int(),
});

export const albumCleanupSampleSchema = z.object({
  release_id: z.string(),
  friend_id: z.number().int(),
  title: z.string(),
  artist: z.string(),
  track_count: z.number().int().optional(),
});

export const albumsCleanupSummaryResponseSchema = z.object({
  totalAlbumsToClean: z.number().int(),
  emptyTrackCount: z.number().int(),
  orphanedAlbums: z.number().int(),
  sample: z.array(albumCleanupSampleSchema),
});

export const albumUpsertWithTracksResponseSchema = z.object({
  album: z.object({}).passthrough(),
  tracks: z.array(z.object({}).passthrough()),
  deletedTracks: z.number().int(),
});

export const albumSearchQuerySchema = z.object({
  q: z.string().optional().default(""),
  sort: z.string().optional().default("date_added:desc"),
  friend_id: intFromInputSchema.optional(),
  limit: nonNegativeIntFromInputSchema.optional().default(20),
  offset: nonNegativeIntFromInputSchema.optional().default(0),
});

export const albumSearchResponseSchema = z.object({
  hits: z.array(z.object({}).passthrough()),
  estimatedTotalHits: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
  query: z.string(),
  sort: z.string(),
});

export const albumDetailResponseSchema = z.object({
  album: z.object({}).passthrough(),
  tracks: z.array(z.object({}).passthrough()),
});

export const albumUpdateBodySchema = z
  .object({
    release_id: z.string().min(1),
    friend_id: intFromInputSchema,
    album_rating: z.number().optional(),
    album_notes: z.string().optional(),
    purchase_price: z.number().optional(),
    condition: z.string().optional(),
    library_identifier: z.string().max(50).nullable().optional(),
  })
  .refine(
    (value) =>
      value.album_rating !== undefined ||
      value.album_notes !== undefined ||
      value.purchase_price !== undefined ||
      value.condition !== undefined ||
      value.library_identifier !== undefined,
    {
      message: "No fields to update",
    }
  );

export const albumUpdateResponseSchema = z.object({
  success: z.boolean(),
  album: z.object({}).passthrough(),
  tracksUpdated: z.number().int().optional(),
});
