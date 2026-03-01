import { z } from "zod";
import {
  aiPromptSettingsGetResponseSchema,
  aiPromptSettingsPutBodySchema,
  aiPromptSettingsPutResponseSchema,
  aiPromptSettingsQuerySchema,
  albumCreateResponseSchema,
  albumDetailResponseSchema,
  albumDiscogsRawResponseSchema,
  albumFriendQuerySchema,
  albumReleaseParamsSchema,
  albumSearchQuerySchema,
  albumSearchResponseSchema,
  albumUpdateBodySchema,
  albumUpdateResponseSchema,
  albumsCleanupSummaryResponseSchema,
  albumUpsertWithTracksResponseSchema,
  apiErrorSchema,
  bulkNotesBodySchema,
  bulkNotesResponseSchema,
  coverArtBackfillBodySchema,
  coverArtBackfillResponseSchema,
  discogsLookupQuerySchema,
  discogsLookupResponseSchema,
  durationBackfillResponseSchema,
  embeddingPromptSettingsGetResponseSchema,
  embeddingPromptSettingsPutBodySchema,
  embeddingPromptSettingsPutResponseSchema,
  embeddingPromptSettingsQuerySchema,
  essentiaBackfillBodySchema,
  essentiaBackfillResponseSchema,
  manifestCleanupResponseSchema,
  manifestVerificationResponseSchema,
  localPlaybackControlBodySchema,
  localPlaybackControlResponseSchema,
  localPlaybackStatusResponseSchema,
  localPlaybackTestResponseSchema,
  playlistCreateBodySchema,
  playlistDeleteQuerySchema,
  playlistDetailParamsSchema,
  playlistDetailResponseSchema,
  playlistGeneticBodySchema,
  playlistGeneticResponseSchema,
  playlistPatchBodySchema,
  playlistSchema,
  queueAlbumDownloadsResponseSchema,
  recommendationsQuerySchema,
  recommendationsBatchBodySchema,
  recommendationsResponseSchema,
  similarVibeQuerySchema,
  similarVibeResponseSchema,
  trackSearchGetQuerySchema,
  trackSearchGetResponseSchema,
  trackSearchPostBodySchema,
  trackSearchPostResponseSchema,
} from "@/api-contract/schemas";

export type HttpMethod = "get" | "post" | "patch" | "put" | "delete";

export type ApiContractRoute = {
  operationId: string;
  method: HttpMethod;
  path: string;
  summary: string;
  tags: string[];
  querySchema?: z.ZodTypeAny;
  paramsSchema?: z.ZodTypeAny;
  bodySchema?: z.ZodTypeAny;
  successSchema: z.ZodTypeAny;
  errorSchema: z.ZodTypeAny;
  openapi: {
    parameters?: Array<Record<string, unknown>>;
    requestBody?: Record<string, unknown>;
    responses: Record<string, unknown>;
    security?: Array<Record<string, string[]>>;
  };
};

const errorResponseSchemaObject: Record<string, unknown> = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["error"],
  additionalProperties: true,
};

const playlistTrackObjectSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    track_id: { type: "string" },
    friend_id: { type: "integer" },
    position: { type: "integer" },
  },
  required: ["track_id", "friend_id"],
  additionalProperties: true,
};

const playlistObjectSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    created_at: { type: "string" },
    tracks: {
      type: "array",
      items: playlistTrackObjectSchema,
    },
  },
  required: ["id", "name", "created_at", "tracks"],
  additionalProperties: true,
};

const trackSearchResponseBase: Record<string, unknown> = {
  type: "object",
  properties: {
    estimatedTotalHits: { type: "integer" },
    offset: { type: "integer" },
    limit: { type: "integer" },
    processingTimeMs: { type: "integer" },
  },
  required: ["estimatedTotalHits", "offset", "limit", "processingTimeMs"],
  additionalProperties: true,
};

const trackEntitySchemaObject: Record<string, unknown> = {
  type: "object",
  properties: {
    id: { type: "integer" },
    track_id: { type: "string" },
    friend_id: { type: "integer" },
    title: { type: "string" },
    artist: { type: "string" },
    album: { type: "string" },
    year: { type: ["string", "number", "null"] },
    genres: { type: "array", items: { type: "string" } },
    styles: { type: "array", items: { type: "string" } },
    bpm: { type: ["number", "string", "null"] },
    key: { type: ["string", "null"] },
    notes: { type: ["string", "null"] },
    local_tags: { type: ["string", "null"] },
    local_audio_url: { type: ["string", "null"] },
    audio_file_album_art_url: { type: ["string", "null"] },
    library_identifier: { type: ["string", "null"] },
  },
  required: ["track_id", "friend_id"],
  additionalProperties: true,
};

const recommendationCandidateSchemaObject: Record<string, unknown> = {
  type: "object",
  properties: {
    trackId: { type: "string" },
    friendId: { type: "integer" },
    simIdentity: { type: ["number", "null"] },
    simAudio: { type: ["number", "null"] },
    metadata: {
      type: "object",
      additionalProperties: true,
      properties: {
        title: { type: "string" },
        artist: { type: "string" },
        album: { type: "string" },
        bpm: { type: ["number", "null"] },
        key: { type: ["string", "null"] },
        genres: { type: "array", items: { type: "string" } },
        styles: { type: "array", items: { type: "string" } },
      },
    },
  },
  required: ["trackId", "friendId", "simIdentity", "simAudio", "metadata"],
  additionalProperties: true,
};

const playlistsListExample = [
  {
    id: 42,
    name: "Warmup Set",
    created_at: "2026-02-17T12:00:00.000Z",
    tracks: [
      { track_id: "trk_001", friend_id: 1, position: 0 },
      { track_id: "trk_099", friend_id: 1, position: 1 },
    ],
  },
];

const playlistDetailExample = {
  playlist_id: 42,
  playlist_name: "Warmup Set",
  tracks: [
    { track_id: "trk_001", friend_id: 1, position: 0 },
    { track_id: "trk_099", friend_id: 1, position: 1 },
  ],
};

const trackSearchGetExample = {
  hits: [
    {
      track_id: "trk_001",
      title: "Move Through",
      artist: "Night Driver",
      friend_id: 1,
    },
  ],
  estimatedTotalHits: 128,
  offset: 0,
  limit: 20,
  processingTimeMs: 4,
};

const trackSearchPostExample = {
  tracks: [
    {
      track_id: "trk_099",
      title: "Kinetic Pulse",
      artist: "Sigma Lane",
      friend_id: 1,
      bpm: 126,
      key: "Am",
    },
  ],
  estimatedTotalHits: 23,
  offset: 0,
  limit: 20,
  processingTimeMs: 5,
};

const recommendationsExample = {
  seedTrackId: "trk_001",
  seedFriendId: 1,
  seedEmbeddings: { identity: true, audio: true },
  candidates: [
    {
      trackId: "trk_910",
      friendId: 1,
      simIdentity: 0.92,
      simAudio: 0.83,
      metadata: {
        title: "Echo Runner",
        artist: "Parallel City",
        album: "Night Transit",
        bpm: 124,
        key: "Am",
        genres: ["House"],
        styles: ["Deep House"],
      },
    },
  ],
  stats: {
    identityCount: 200,
    audioCount: 200,
    unionCount: 310,
    timingMs: { identityQuery: 18, audioQuery: 17, total: 41 },
  },
};

const manifestVerifyExample = {
  message: "Manifest verification complete",
  results: [
    {
      username: "dj_alex",
      totalReleaseIds: 42,
      missingFiles: ["12345", "23456"],
      validFiles: ["10001", "10002"],
    },
  ],
  summary: {
    totalManifests: 1,
    totalMissingFiles: 2,
    totalValidFiles: 40,
  },
};

const manifestCleanupExample = {
  message: "Manifests cleaned successfully",
  results: [
    {
      username: "dj_alex",
      before: 42,
      after: 40,
      removed: ["12345", "23456"],
    },
  ],
  summary: {
    totalManifests: 1,
    totalRemoved: 2,
    totalKept: 40,
  },
};

function buildPathParameters(path: string): Array<Record<string, unknown>> {
  const params = Array.from(path.matchAll(/\{([^}]+)\}/g));
  return params.map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
}

type TrackRouteOptions = {
  parameters?: Array<Record<string, unknown>>;
  requestBody?: Record<string, unknown>;
  responses?: Record<string, unknown>;
};

function exampleFromSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== "object") return "example";
  const s = schema as Record<string, unknown>;

  if (s.example !== undefined) return s.example;

  if (Array.isArray(s.oneOf) && s.oneOf.length > 0) {
    return exampleFromSchema(s.oneOf[0]);
  }

  const type = s.type;
  if (type === "string") return "string";
  if (type === "integer") return 1;
  if (type === "number") return 1.23;
  if (type === "boolean") return true;
  if (Array.isArray(type) && type.length > 0) {
    const first = type.find((t) => t !== "null") ?? type[0];
    return exampleFromSchema({ ...s, type: first });
  }
  if (type === "array") {
    return [exampleFromSchema(s.items)];
  }
  if (type === "object") {
    const properties =
      s.properties && typeof s.properties === "object"
        ? (s.properties as Record<string, unknown>)
        : undefined;
    if (properties && Object.keys(properties).length > 0) {
      const obj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(properties)) {
        obj[key] = exampleFromSchema(value);
      }
      return obj;
    }
    if (s.additionalProperties) {
      const additional =
        s.additionalProperties === true ? { type: "string" } : s.additionalProperties;
      return { exampleKey: exampleFromSchema(additional) };
    }
    return {};
  }

  return "example";
}

function withExamples(responses: Record<string, unknown>): Record<string, unknown> {
  const cloned = structuredClone(responses);
  for (const response of Object.values(cloned)) {
    if (!response || typeof response !== "object") continue;
    const responseObj = response as Record<string, unknown>;
    const content =
      responseObj.content && typeof responseObj.content === "object"
        ? (responseObj.content as Record<string, unknown>)
        : undefined;
    if (!content) continue;

    const appJson = content["application/json"];
    if (!appJson || typeof appJson !== "object") continue;

    const media = appJson as Record<string, unknown>;
    if (media.example !== undefined || media.examples !== undefined) continue;
    if (!media.schema) continue;
    media.example = exampleFromSchema(media.schema);
  }
  return cloned;
}

function makeTrackRoute(
  method: HttpMethod,
  path: string,
  summary: string,
  options: TrackRouteOptions = {}
): ApiContractRoute {
  const responses =
    options.responses ??
    {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
      },
      "400": {
        description: "Validation or request error",
        content: {
          "application/json": { schema: errorResponseSchemaObject },
        },
      },
      "500": {
        description: "Server error",
        content: {
          "application/json": { schema: errorResponseSchemaObject },
        },
      },
    };

  return {
    operationId: `${method}${path.replace(/[\/{}-]+/g, "_")}`,
    method,
    path,
    summary,
    tags: ["Tracks"],
    successSchema: z.unknown(),
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: options.parameters ?? buildPathParameters(path),
      requestBody: options.requestBody,
      responses: withExamples(responses),
    },
  };
}

const remainingTracksContracts: ApiContractRoute[] = [
  makeTrackRoute("get", "/api/tracks", "List tracks", {
    responses: {
      "200": {
        description: "Tracks fetched",
        content: {
          "application/json": {
            schema: { type: "array", items: trackEntitySchemaObject },
          },
        },
      },
      "500": {
        description: "Server error",
        content: { "application/json": { schema: errorResponseSchemaObject } },
      },
    },
  }),
  makeTrackRoute("patch", "/api/tracks/update", "Update track fields", {
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              track_id: { type: "string" },
              friend_id: { type: "integer" },
            },
            required: ["track_id", "friend_id"],
            additionalProperties: true,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Updated track",
        content: {
          "application/json": {
            schema: trackEntitySchemaObject,
          },
        },
      },
      "404": {
        description: "Track not found",
        content: { "application/json": { schema: errorResponseSchemaObject } },
      },
      "500": {
        description: "Update error",
        content: { "application/json": { schema: errorResponseSchemaObject } },
      },
    },
  }),
  makeTrackRoute("post", "/api/tracks/upload", "Upload track audio", {
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: { type: "string", format: "binary" },
              track_id: { type: "string" },
              friend_id: { type: "string" },
            },
            required: ["file", "track_id"],
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Audio uploaded and analyzed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                file: { type: "string" },
                track_id: { type: "string" },
                local_audio_url: { type: "string" },
                format: { type: "string" },
                analysis: { type: "object", additionalProperties: true },
              },
              required: ["success", "file", "track_id", "local_audio_url", "format", "analysis"],
            },
          },
        },
      },
      "400": { description: "Invalid upload payload", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "500": { description: "Upload/processing error", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("post", "/api/tracks/vectorize", "Vectorize track", {
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { track_id: { type: "string" }, friend_id: { type: "integer" } },
            required: ["track_id", "friend_id"],
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Track embedding generated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                embedding: { type: "array", items: { type: "number" } },
              },
              required: ["embedding"],
            },
          },
        },
      },
      "400": { description: "Missing required fields", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "404": { description: "Track not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "500": { description: "Vectorization error", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("post", "/api/tracks/analyze-async", "Queue async track analysis", {
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              track_id: { type: "string" },
              friend_id: { type: "integer" },
              apple_music_url: { type: "string" },
              spotify_url: { type: "string" },
              youtube_url: { type: "string" },
              soundcloud_url: { type: "string" },
              preferred_downloader: { type: "string" },
            },
            required: ["track_id", "friend_id"],
            additionalProperties: true,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Job queued",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                jobId: { type: "string" },
                message: { type: "string" },
              },
              required: ["success", "jobId", "message"],
            },
          },
        },
      },
      "400": { description: "Invalid request", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "500": { description: "Queueing error", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute(
    "post",
    "/api/tracks/analyze-local-async",
    "Queue async local track analysis",
    {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                track_id: { type: "string" },
                friend_id: { type: "integer" },
                local_audio_url: { type: "string" },
              },
              required: ["track_id", "friend_id"],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Local analysis job queued",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  jobId: { type: "string" },
                  message: { type: "string" },
                },
                required: ["success", "jobId", "message"],
              },
            },
          },
        },
        "400": { description: "Invalid request", content: { "application/json": { schema: errorResponseSchemaObject } } },
        "404": { description: "Track not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
        "500": { description: "Queueing error", content: { "application/json": { schema: errorResponseSchemaObject } } },
      },
    }
  ),
  {
    operationId: "backfillTrackEssentia",
    method: "post",
    path: "/api/tracks/backfill-essentia",
    summary: "Backfill essentia analysis",
    tags: ["Tracks"],
    bodySchema: essentiaBackfillBodySchema,
    successSchema: essentiaBackfillResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                friend_id: { type: ["integer", "null"] },
                force: { type: "boolean", default: false },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Essentia jobs queued",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  queued: { type: "integer" },
                  skipped_existing: { type: "integer" },
                  total_candidates: { type: "integer" },
                  force: { type: "boolean" },
                  jobIds: { type: "array", items: { type: "string" } },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        track_id: { type: "string" },
                        friend_id: { type: "integer" },
                        error: { type: "string" },
                      },
                      required: ["track_id", "friend_id", "error"],
                    },
                  },
                },
                required: [
                  "queued",
                  "skipped_existing",
                  "total_candidates",
                  "force",
                  "jobIds",
                  "errors",
                ],
              },
            },
          },
        },
        "400": {
          description: "Invalid request",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "500": {
          description: "Queueing error",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
      },
    },
  },
  makeTrackRoute("post", "/api/tracks/batch", "Fetch ordered batch of tracks", {
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              tracks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    track_id: { type: "string" },
                    friend_id: { type: "integer" },
                    position: { type: "integer" },
                  },
                  required: ["track_id", "friend_id"],
                },
              },
            },
            required: ["tracks"],
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Tracks in input order",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: trackEntitySchemaObject,
            },
          },
        },
      },
      "500": { description: "Batch query error", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  {
    operationId: "bulkUpdateTrackNotes",
    method: "post",
    path: "/api/tracks/bulk-notes",
    summary: "Bulk update track notes",
    tags: ["Tracks"],
    bodySchema: bulkNotesBodySchema,
    successSchema: bulkNotesResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                updates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      track_id: { type: "string" },
                      local_tags: { type: "string" },
                      notes: { type: "string" },
                    },
                    required: ["track_id"],
                    additionalProperties: true,
                  },
                },
              },
              required: ["updates"],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Bulk update result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  updated: { type: "integer" },
                  tracks: { type: "array", items: trackEntitySchemaObject },
                },
                required: ["success"],
                additionalProperties: true,
              },
            },
          },
        },
        "400": {
          description: "Invalid input",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "500": {
          description: "Bulk update error",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
      },
    },
  },
  {
    operationId: "extractMissingTrackCoverArt",
    method: "post",
    path: "/api/tracks/extract-missing-cover-art",
    summary: "Extract missing cover art",
    tags: ["Tracks"],
    bodySchema: coverArtBackfillBodySchema,
    successSchema: coverArtBackfillResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                friend_id: { type: ["integer", "null"] },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Cover-art extraction jobs queued",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  queued: { type: "integer" },
                  queuedAlbums: { type: "integer" },
                  tracksImpacted: { type: "integer" },
                  jobIds: { type: "array", items: { type: "string" } },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        track_id: { type: "string" },
                        friend_id: { type: "integer" },
                        release_id: { type: ["string", "null"] },
                        error: { type: "string" },
                      },
                      required: ["track_id", "friend_id", "release_id", "error"],
                    },
                  },
                },
                required: ["queued", "queuedAlbums", "tracksImpacted", "jobIds", "errors"],
              },
            },
          },
        },
        "400": {
          description: "Invalid request",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "500": {
          description: "Queueing error",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
      },
    },
  },
  makeTrackRoute("post", "/api/tracks/fix-duration", "Fix track duration", {
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              track_id: { type: "string" },
              friend_id: { type: "integer" },
            },
            required: ["track_id", "friend_id"],
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Duration job queued",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                jobId: { type: "string" },
                track_id: { type: "string" },
                friend_id: { type: "integer" },
              },
              required: ["jobId", "track_id", "friend_id"],
            },
          },
        },
      },
      "400": { description: "Invalid request", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "500": { description: "Queueing error", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  {
    operationId: "fixTracksMissingDuration",
    method: "post",
    path: "/api/tracks/fix-missing-durations",
    summary: "Fix missing durations",
    tags: ["Tracks"],
    successSchema: durationBackfillResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      responses: {
        "200": {
          description: "Bulk duration jobs queued",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  queued: { type: "integer" },
                  jobIds: { type: "array", items: { type: "string" } },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        track_id: { type: "string" },
                        error: { type: "string" },
                      },
                      required: ["track_id", "error"],
                    },
                  },
                },
                required: ["queued", "jobIds", "errors"],
              },
            },
          },
        },
        "500": {
          description: "Queueing error",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
      },
    },
  },
  makeTrackRoute("get", "/api/tracks/job-events/{jobId}", "Stream track job events", {
    parameters: [
      { name: "jobId", in: "path", required: true, schema: { type: "string" } },
    ],
    responses: {
      "200": {
        description: "Server-sent event stream",
        content: {
          "text/event-stream": {
            schema: { type: "string" },
          },
        },
      },
      "400": { description: "Missing jobId", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("get", "/api/tracks/job-status/{jobId}", "Get track job status", {
    parameters: [
      { name: "jobId", in: "path", required: true, schema: { type: "string" } },
    ],
    responses: {
      "200": {
        description: "Job status",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                state: { type: "string" },
                progress: { type: "number" },
                data: { type: "object", additionalProperties: true },
                returnvalue: { type: ["object", "array", "string", "number", "boolean", "null"] },
                failedReason: { type: "string" },
              },
              required: ["id", "state", "progress", "data"],
            },
          },
        },
      },
      "400": { description: "Missing jobId", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "404": { description: "Job not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "500": { description: "Lookup error", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute(
    "get",
    "/api/tracks/missing-apple-music",
    "List tracks missing Apple Music URL",
    {
      parameters: [
        { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
        { name: "pageSize", in: "query", required: false, schema: { type: "integer", default: 50 } },
        { name: "friendId", in: "query", required: false, schema: { type: "integer" } },
      ],
      responses: {
        "200": {
          description: "Paginated tracks",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  tracks: { type: "array", items: trackEntitySchemaObject },
                  page: { type: "integer" },
                  pageSize: { type: "integer" },
                  total: { type: "integer" },
                  totalPages: { type: "integer" },
                },
                required: ["tracks", "page", "pageSize", "total", "totalPages"],
              },
            },
          },
        },
      },
    }
  ),
  makeTrackRoute("post", "/api/tracks/playlist_counts", "Get playlist counts for tracks", {
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              track_refs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    track_id: { type: "string" },
                    friend_id: { type: "integer" },
                  },
                  required: ["track_id", "friend_id"],
                },
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Track playlist counts keyed by track_id:friend_id",
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: { type: "integer" },
            },
            examples: {
              counts: {
                summary: "Count map",
                value: {
                  "track_123:1": 2,
                  "track_999:1": 1,
                },
              },
            },
          },
        },
      },
    },
  }),
  makeTrackRoute("get", "/api/tracks/reindex", "Get track reindex usage info", {
    responses: {
      "200": {
        description: "Usage hint",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
              },
              required: ["success", "message"],
            },
          },
        },
      },
    },
  }),
  makeTrackRoute("post", "/api/tracks/reindex", "Reindex tracks", {
    responses: {
      "200": {
        description: "Reindex result",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                indexed: { type: "integer" },
                message: { type: "string" },
                error: { type: "string" },
              },
              required: ["success"],
            },
          },
        },
      },
      "500": { description: "Reindex error", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("get", "/api/tracks/{id}", "Get track by id", {
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" } },
      { name: "friend_id", in: "query", required: true, schema: { type: "integer" } },
    ],
    responses: {
      "200": {
        description: "Track details",
        content: {
          "application/json": {
            schema: {
              ...trackEntitySchemaObject,
            },
          },
        },
      },
      "400": { description: "Missing required parameters", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "404": { description: "Track not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("get", "/api/tracks/{id}/audio-metadata", "Get local audio metadata for track", {
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" } },
      { name: "friend_id", in: "query", required: true, schema: { type: "integer" } },
    ],
    responses: {
      "200": {
        description: "Audio metadata/probe result",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                track_id: { type: "string" },
                friend_id: { type: "integer" },
                local_audio_url: { type: "string" },
                audio_file_album_art_url: { type: ["string", "null"] },
                has_embedded_cover: { type: "boolean" },
                embedded_cover: { type: ["object", "null"], additionalProperties: true },
                probe: { type: "object", additionalProperties: true },
              },
              required: ["track_id", "friend_id", "local_audio_url", "has_embedded_cover", "embedded_cover", "probe"],
            },
          },
        },
      },
      "400": { description: "Missing required parameters", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "404": { description: "Track or audio not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("post", "/api/tracks/{id}/audio-metadata", "Extract embedded audio cover art", {
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { friend_id: { type: "integer" } },
            required: ["friend_id"],
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Cover extracted",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                audio_file_album_art_url: { type: "string" },
                message: { type: "string" },
              },
              required: ["success", "audio_file_album_art_url", "message"],
            },
          },
        },
      },
      "400": { description: "Missing required parameters", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "404": { description: "No embedded artwork / track not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("get", "/api/tracks/{id}/embedding-preview", "Preview track embedding", {
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" } },
      { name: "friend_id", in: "query", required: true, schema: { type: "integer" } },
    ],
    responses: {
      "200": {
        description: "Embedding prompt preview",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                track_id: { type: "string" },
                friend_id: { type: "integer" },
                isDefaultTemplate: { type: "boolean" },
                template: { type: "string" },
                prompt: { type: "string" },
              },
              required: ["track_id", "friend_id", "isDefaultTemplate", "template", "prompt"],
            },
          },
        },
      },
      "400": { description: "Missing required parameters", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "404": { description: "Track not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("get", "/api/tracks/{id}/essentia", "Get essentia analysis", {
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" } },
      { name: "friend_id", in: "query", required: true, schema: { type: "integer" } },
    ],
    responses: {
      "200": {
        description: "Essentia analysis payload",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                track_id: { type: "string" },
                friend_id: { type: "integer" },
                file_path: { type: "string" },
                data: { type: "object", additionalProperties: true },
              },
              required: ["track_id", "friend_id", "file_path", "data"],
            },
          },
        },
      },
      "400": { description: "Missing required parameters", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "404": { description: "Analysis not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute("get", "/api/tracks/{id}/playlists", "Get playlists containing track", {
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" } },
      { name: "friend_id", in: "query", required: true, schema: { type: "integer" } },
    ],
    responses: {
      "200": {
        description: "Track playlist memberships",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                playlists: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      name: { type: "string" },
                      position: { type: "integer" },
                    },
                    required: ["id", "name", "position"],
                  },
                },
              },
              required: ["playlists"],
            },
          },
        },
      },
      "400": { description: "Missing required parameters", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
  makeTrackRoute(
    "post",
    "/api/tracks/{id}/sync-audio-composer",
    "Sync audio composer into track",
    {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { friend_id: { type: "integer" } },
              required: ["friend_id"],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Composer synced",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  composer: { type: "string" },
                  previous_composer: { type: ["string", "null"] },
                  message: { type: "string" },
                },
                required: ["success", "composer", "previous_composer", "message"],
              },
            },
          },
        },
        "400": { description: "Missing required parameters", content: { "application/json": { schema: errorResponseSchemaObject } } },
        "404": { description: "Track or composer tag not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
      },
    }
  ),
  makeTrackRoute("post", "/api/tracks/{id}/sync-audio-year", "Sync audio year into track", {
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { friend_id: { type: "integer" } },
            required: ["friend_id"],
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Year synced",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                year: { type: "string" },
                previous_year: { type: ["string", "number", "null"] },
                message: { type: "string" },
              },
              required: ["success", "year", "previous_year", "message"],
            },
          },
        },
      },
      "400": { description: "Missing required parameters", content: { "application/json": { schema: errorResponseSchemaObject } } },
      "404": { description: "Track or year tag not found", content: { "application/json": { schema: errorResponseSchemaObject } } },
    },
  }),
];

export const apiContractRoutes: ApiContractRoute[] = [
  {
    operationId: "getLocalPlaybackStatus",
    method: "get",
    path: "/api/playback/local",
    summary: "Get current local playback status",
    tags: ["Playback"],
    successSchema: localPlaybackStatusResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      responses: {
        "200": {
          description: "Local playback status",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  enabled: { type: "boolean" },
                  status: { type: "object", additionalProperties: true },
                },
                required: ["enabled", "status"],
              },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "controlLocalPlayback",
    method: "post",
    path: "/api/playback/local",
    summary: "Control local playback actions",
    tags: ["Playback"],
    bodySchema: localPlaybackControlBodySchema,
    successSchema: localPlaybackControlResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["play", "pause", "resume", "stop", "seek", "volume"],
                },
                filename: { type: "string" },
                seconds: { type: "number" },
                volume: { type: "number" },
              },
              required: ["action"],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Playback action result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  status: { type: "object", additionalProperties: true },
                  volume: { type: "number" },
                },
                required: ["success"],
                additionalProperties: true,
              },
            },
          },
        },
        "400": {
          description: "Invalid action payload",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "testLocalPlayback",
    method: "get",
    path: "/api/playback/test",
    summary: "Test local playback configuration and availability",
    tags: ["Playback"],
    successSchema: localPlaybackTestResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      responses: {
        "200": {
          description: "Playback test result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  available: { type: "boolean" },
                  message: { type: "string" },
                  error: { type: "string" },
                  config: { type: "object", additionalProperties: true },
                  testResult: { type: "object", additionalProperties: true },
                },
                required: ["available"],
                additionalProperties: true,
              },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "listPlaylists",
    method: "get",
    path: "/api/playlists",
    summary: "List playlists",
    tags: ["Playlists"],
    successSchema: z.array(playlistSchema),
    errorSchema: apiErrorSchema,
    openapi: {
      responses: {
        "200": {
          description: "Playlists fetched",
          content: {
            "application/json": {
              schema: { type: "array", items: playlistObjectSchema },
              examples: {
                playlistsList: {
                  summary: "Playlists list",
                  value: playlistsListExample,
                },
              },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "createPlaylist",
    method: "post",
    path: "/api/playlists",
    summary: "Create playlist",
    tags: ["Playlists"],
    bodySchema: playlistCreateBodySchema,
    successSchema: playlistSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                tracks: {
                  type: "array",
                  items: { type: "object", additionalProperties: true },
                },
                default_friend_id: { type: "integer" },
              },
              required: ["name"],
              additionalProperties: true,
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Playlist created",
          content: {
            "application/json": { schema: playlistObjectSchema },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "updatePlaylist",
    method: "patch",
    path: "/api/playlists",
    summary: "Update playlist",
    tags: ["Playlists"],
    bodySchema: playlistPatchBodySchema,
    successSchema: playlistSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                tracks: {
                  type: "array",
                  items: {
                    oneOf: [{ type: "string" }, { type: "object", additionalProperties: true }],
                  },
                },
                default_friend_id: { type: "integer" },
              },
              required: ["id"],
              additionalProperties: true,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Playlist updated",
          content: {
            "application/json": { schema: playlistObjectSchema },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Playlist not found",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "deletePlaylist",
    method: "delete",
    path: "/api/playlists",
    summary: "Delete playlist",
    tags: ["Playlists"],
    querySchema: playlistDeleteQuerySchema,
    successSchema: z.object({ success: z.boolean() }),
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        {
          name: "id",
          in: "query",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": {
          description: "Playlist deleted",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { success: { type: "boolean" } },
                required: ["success"],
              },
            },
          },
        },
        "400": {
          description: "Missing id",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Playlist not found",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "getPlaylistTracks",
    method: "get",
    path: "/api/playlists/{id}/tracks",
    summary: "Get playlist detail",
    tags: ["Playlists"],
    paramsSchema: playlistDetailParamsSchema,
    successSchema: playlistDetailResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": {
          description: "Playlist detail",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  playlist_id: { type: "integer" },
                  playlist_name: { type: ["string", "null"] },
                  tracks: { type: "array", items: playlistTrackObjectSchema },
                },
                required: ["playlist_id", "tracks"],
                additionalProperties: true,
              },
              examples: {
                playlistDetail: {
                  summary: "Playlist detail",
                  value: playlistDetailExample,
                },
              },
            },
          },
        },
        "400": {
          description: "Invalid id",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Not found",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "generateGeneticPlaylist",
    method: "post",
    path: "/api/playlists/genetic",
    summary: "Generate genetic ordering for playlist tracks",
    tags: ["Playlists"],
    bodySchema: playlistGeneticBodySchema,
    successSchema: playlistGeneticResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                playlist: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      track_id: { type: "string" },
                      friend_id: { type: "integer" },
                      bpm: { type: ["number", "string", "null"] },
                      embedding: {
                        oneOf: [
                          { type: "string" },
                          { type: "array", items: { type: "number" } },
                          { type: "null" },
                        ],
                      },
                      _vectors: {
                        type: "object",
                        properties: {
                          default: { type: "array", items: { type: "number" } },
                        },
                        additionalProperties: true,
                      },
                    },
                    required: ["track_id"],
                    additionalProperties: true,
                  },
                  minItems: 1,
                },
              },
              required: ["playlist"],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Genetic ordering result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  result: {
                    oneOf: [
                      {
                        type: "array",
                        items: { type: "object", additionalProperties: true },
                      },
                      {
                        type: "object",
                        additionalProperties: { type: "object", additionalProperties: true },
                      },
                    ],
                  },
                },
                required: ["result"],
                additionalProperties: true,
              },
            },
          },
        },
        "400": {
          description: "Invalid track data for optimization",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                  invalid: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        track_id: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["reason"],
                      additionalProperties: false,
                    },
                  },
                  invalid_count: { type: "integer" },
                },
                required: ["error", "invalid", "invalid_count"],
                additionalProperties: true,
              },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "searchTracksQuery",
    method: "get",
    path: "/api/tracks/search",
    summary: "Search tracks (query params)",
    tags: ["Tracks"],
    querySchema: trackSearchGetQuerySchema,
    successSchema: trackSearchGetResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        { name: "q", in: "query", required: false, schema: { type: "string" } },
        { name: "limit", in: "query", required: false, schema: { type: "integer", default: 20 } },
        { name: "offset", in: "query", required: false, schema: { type: "integer", default: 0 } },
        { name: "filter", in: "query", required: false, schema: { type: "string" } },
      ],
      responses: {
        "200": {
          description: "Search results",
          content: {
            "application/json": {
              schema: {
                ...trackSearchResponseBase,
                properties: {
                  ...(trackSearchResponseBase.properties as Record<string, unknown>),
                  hits: { type: "array", items: { type: "object", additionalProperties: true } },
                },
                required: [...(trackSearchResponseBase.required as string[]), "hits"],
              },
              examples: {
                trackSearch: {
                  summary: "Track search",
                  value: trackSearchGetExample,
                },
              },
            },
          },
        },
        "500": {
          description: "Search error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "searchTracksFiltered",
    method: "post",
    path: "/api/tracks/search",
    summary: "Search tracks (body filters)",
    tags: ["Tracks"],
    bodySchema: trackSearchPostBodySchema,
    successSchema: trackSearchPostResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                query: { type: "string" },
                limit: { type: "integer", default: 20 },
                offset: { type: "integer", default: 0 },
                filters: {
                  type: "object",
                  properties: {
                    bpm_min: { type: "number" },
                    bpm_max: { type: "number" },
                    key: { type: "string" },
                    star_rating: { type: "number" },
                    friend_id: { type: "integer" },
                  },
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Filtered search results",
          content: {
            "application/json": {
              schema: {
                ...trackSearchResponseBase,
                properties: {
                  ...(trackSearchResponseBase.properties as Record<string, unknown>),
                  tracks: { type: "array", items: { type: "object", additionalProperties: true } },
                },
                required: [...(trackSearchResponseBase.required as string[]), "tracks"],
              },
              examples: {
                filteredSearch: {
                  summary: "Filtered track search",
                  value: trackSearchPostExample,
                },
              },
            },
          },
        },
        "500": {
          description: "Search error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "recommendationCandidates",
    method: "get",
    path: "/api/recommendations/candidates",
    summary: "Get recommendation candidates",
    tags: ["Recommendations"],
    querySchema: recommendationsQuerySchema,
    successSchema: recommendationsResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        { name: "track_id", in: "query", required: true, schema: { type: "string" } },
        { name: "friend_id", in: "query", required: true, schema: { type: "integer" } },
        { name: "limit_identity", in: "query", required: false, schema: { type: "integer", default: 200 } },
        { name: "limit_audio", in: "query", required: false, schema: { type: "integer", default: 200 } },
        { name: "ivfflat_probes", in: "query", required: false, schema: { type: "integer", default: 10 } },
      ],
      responses: {
        "200": {
          description: "Recommendation candidates",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  seedTrackId: { type: "string" },
                  seedFriendId: { type: "integer" },
                  seedEmbeddings: {
                    type: "object",
                    properties: {
                      identity: { type: "boolean" },
                      audio: { type: "boolean" },
                    },
                    required: ["identity", "audio"],
                  },
                  candidates: { type: "array", items: recommendationCandidateSchemaObject },
                  stats: { type: "object", additionalProperties: true },
                },
                required: ["seedTrackId", "seedFriendId", "seedEmbeddings", "candidates", "stats"],
                additionalProperties: true,
              },
              examples: {
                recommendationCandidates: {
                  summary: "Recommendations",
                  value: recommendationsExample,
                },
              },
            },
          },
        },
        "400": {
          description: "Invalid query",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Seed embeddings missing",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "recommendationCandidatesBatch",
    method: "post",
    path: "/api/recommendations/candidates",
    summary: "Get recommendation candidates from multiple seed tracks",
    tags: ["Recommendations"],
    bodySchema: recommendationsBatchBodySchema,
    successSchema: recommendationsResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                tracks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      track_id: { type: "string" },
                      friend_id: { type: "integer" },
                    },
                    required: ["track_id", "friend_id"],
                  },
                  minItems: 1,
                  maxItems: 100,
                },
                limit_identity: { type: "integer", default: 200 },
                limit_audio: { type: "integer", default: 200 },
                ivfflat_probes: { type: "integer", default: 10 },
              },
              required: ["tracks"],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Recommendation candidates",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  seedTrackId: { type: "string" },
                  seedFriendId: { type: "integer" },
                  seedEmbeddings: {
                    type: "object",
                    properties: {
                      identity: { type: "boolean" },
                      audio: { type: "boolean" },
                    },
                    required: ["identity", "audio"],
                  },
                  candidates: { type: "array", items: recommendationCandidateSchemaObject },
                  stats: { type: "object", additionalProperties: true },
                },
                required: ["seedTrackId", "seedFriendId", "seedEmbeddings", "candidates", "stats"],
                additionalProperties: true,
              },
            },
          },
        },
        "400": {
          description: "Invalid body",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "404": {
          description: "Seed embeddings missing",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "500": {
          description: "Server error",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
      },
    },
  },
  {
    operationId: "findSimilarVibeTracks",
    method: "get",
    path: "/api/embeddings/similar-vibe",
    summary: "Find similar tracks by audio vibe embedding",
    tags: ["Embeddings"],
    querySchema: similarVibeQuerySchema,
    successSchema: similarVibeResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        { name: "track_id", in: "query", required: true, schema: { type: "string" } },
        { name: "friend_id", in: "query", required: true, schema: { type: "integer" } },
        { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50 } },
        { name: "ivfflat_probes", in: "query", required: false, schema: { type: "integer", default: 10 } },
      ],
      responses: {
        "200": {
          description: "Similar vibe tracks",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  source_track_id: { type: "string" },
                  source_friend_id: { type: "integer" },
                  count: { type: "integer" },
                  tracks: { type: "array", items: { type: "object", additionalProperties: true } },
                },
                required: ["source_track_id", "source_friend_id", "count", "tracks"],
              },
            },
          },
        },
        "400": {
          description: "Missing or invalid query",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "404": {
          description: "Audio vibe embedding not found",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "500": {
          description: "Server error",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
      },
    },
  },
  {
    operationId: "getAiPromptSettings",
    method: "get",
    path: "/api/settings/ai-prompt",
    summary: "Get AI metadata prompt settings",
    tags: ["Settings"],
    querySchema: aiPromptSettingsQuerySchema,
    successSchema: aiPromptSettingsGetResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        {
          name: "friend_id",
          in: "query",
          required: false,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": {
          description: "AI prompt settings",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prompt: { type: "string" },
                  defaultPrompt: { type: "string" },
                  isDefault: { type: "boolean" },
                },
                required: ["prompt", "defaultPrompt", "isDefault"],
              },
            },
          },
        },
        "400": {
          description: "Invalid query parameter",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "updateAiPromptSettings",
    method: "put",
    path: "/api/settings/ai-prompt",
    summary: "Update AI metadata prompt settings",
    tags: ["Settings"],
    bodySchema: aiPromptSettingsPutBodySchema,
    successSchema: aiPromptSettingsPutResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                friend_id: { type: "integer" },
                prompt: { type: "string" },
              },
              required: ["friend_id"],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "AI prompt updated",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prompt: { type: "string" },
                  isDefault: { type: "boolean" },
                },
                required: ["prompt", "isDefault"],
              },
            },
          },
        },
        "400": {
          description: "Invalid payload",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "getEmbeddingPromptSettings",
    method: "get",
    path: "/api/settings/embedding-prompt",
    summary: "Get track embedding prompt settings",
    tags: ["Settings"],
    querySchema: embeddingPromptSettingsQuerySchema,
    successSchema: embeddingPromptSettingsGetResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        {
          name: "friend_id",
          in: "query",
          required: false,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": {
          description: "Embedding prompt settings",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  template: { type: "string" },
                  defaultTemplate: { type: "string" },
                  isDefault: { type: "boolean" },
                },
                required: ["template", "defaultTemplate", "isDefault"],
              },
            },
          },
        },
        "400": {
          description: "Invalid query parameter",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "updateEmbeddingPromptSettings",
    method: "put",
    path: "/api/settings/embedding-prompt",
    summary: "Update track embedding prompt settings",
    tags: ["Settings"],
    bodySchema: embeddingPromptSettingsPutBodySchema,
    successSchema: embeddingPromptSettingsPutResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                friend_id: { type: "integer" },
                template: { type: "string" },
              },
              required: ["friend_id"],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Embedding prompt updated",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  template: { type: "string" },
                  isDefault: { type: "boolean" },
                },
                required: ["template", "isDefault"],
              },
            },
          },
        },
        "400": {
          description: "Invalid payload",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "lookupAiDiscogsRelease",
    method: "get",
    path: "/api/ai/discogs",
    summary: "Lookup Discogs release and matched track by track_id",
    tags: ["AI"],
    querySchema: discogsLookupQuerySchema,
    successSchema: discogsLookupResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        {
          name: "track_id",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "username",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "friend_id",
          in: "query",
          required: false,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": {
          description: "Discogs lookup result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  releaseId: { type: "string" },
                  filePath: { type: "string" },
                  release: { type: "object", additionalProperties: true },
                  matchedTrack: { type: "object", additionalProperties: true },
                },
                additionalProperties: true,
              },
            },
          },
        },
        "400": {
          description: "Missing or invalid query parameter",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Discogs release file not found",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "searchAlbums",
    method: "get",
    path: "/api/albums",
    summary: "Search and list albums",
    tags: ["Albums"],
    querySchema: albumSearchQuerySchema,
    successSchema: albumSearchResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        { name: "q", in: "query", required: false, schema: { type: "string" } },
        { name: "sort", in: "query", required: false, schema: { type: "string", default: "date_added:desc" } },
        { name: "friend_id", in: "query", required: false, schema: { type: "integer" } },
        { name: "limit", in: "query", required: false, schema: { type: "integer", default: 20 } },
        { name: "offset", in: "query", required: false, schema: { type: "integer", default: 0 } },
      ],
      responses: {
        "200": {
          description: "Albums search result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  hits: { type: "array", items: { type: "object", additionalProperties: true } },
                  estimatedTotalHits: { type: "integer" },
                  offset: { type: "integer" },
                  limit: { type: "integer" },
                  query: { type: "string" },
                  sort: { type: "string" },
                },
                required: ["hits", "estimatedTotalHits", "offset", "limit", "query", "sort"],
              },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "getAlbumDetail",
    method: "get",
    path: "/api/albums/{releaseId}",
    summary: "Fetch album with tracks",
    tags: ["Albums"],
    paramsSchema: albumReleaseParamsSchema,
    querySchema: albumFriendQuerySchema,
    successSchema: albumDetailResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        {
          name: "releaseId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "friend_id",
          in: "query",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": {
          description: "Album detail",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  album: { type: "object", additionalProperties: true },
                  tracks: { type: "array", items: { type: "object", additionalProperties: true } },
                },
                required: ["album", "tracks"],
              },
            },
          },
        },
        "400": {
          description: "Invalid query parameter",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Album not found",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "updateAlbum",
    method: "patch",
    path: "/api/albums/update",
    summary: "Update album metadata",
    tags: ["Albums"],
    bodySchema: albumUpdateBodySchema,
    successSchema: albumUpdateResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                release_id: { type: "string" },
                friend_id: { type: "integer" },
                album_rating: { type: "number" },
                album_notes: { type: "string" },
                purchase_price: { type: "number" },
                condition: { type: "string" },
                library_identifier: { type: ["string", "null"] },
              },
              required: ["release_id", "friend_id"],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Album updated",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  album: { type: "object", additionalProperties: true },
                  tracksUpdated: { type: "integer" },
                },
                required: ["success", "album"],
              },
            },
          },
        },
        "400": {
          description: "Invalid payload",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Album not found",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "409": {
          description: "Duplicate library identifier",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "createAlbum",
    method: "post",
    path: "/api/albums/create",
    summary: "Create a local album with tracks",
    tags: ["Albums"],
    successSchema: albumCreateResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                album: { type: "string", description: "JSON stringified album payload" },
                tracks: { type: "string", description: "JSON stringified tracks payload" },
                friend_id: { type: "string" },
                cover_art: { type: "string", format: "binary" },
              },
              required: ["album", "tracks", "friend_id"],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Album created",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  album: {
                    type: "object",
                    properties: {
                      release_id: { type: "string" },
                      friend_id: { type: "integer" },
                      title: { type: "string" },
                      artist: { type: "string" },
                      year: { type: ["string", "number", "null"] },
                      genres: { type: "array", items: { type: "string" } },
                      styles: { type: "array", items: { type: "string" } },
                      album_thumbnail: { type: ["string", "null"] },
                      track_count: { type: "integer" },
                      date_added: { type: "string" },
                      date_changed: { type: "string" },
                      library_identifier: { type: ["string", "null"] },
                    },
                    required: ["release_id", "friend_id", "title", "artist"],
                    additionalProperties: true,
                  },
                  tracks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        track_id: { type: "string" },
                        friend_id: { type: "integer" },
                        title: { type: "string" },
                        artist: { type: "string" },
                        album: { type: "string" },
                        year: { type: ["string", "number", "null"] },
                        duration: { type: "string" },
                        duration_seconds: { type: ["number", "null"] },
                        position: { type: ["string", "number"] },
                        release_id: { type: ["string", "null"] },
                        library_identifier: { type: ["string", "null"] },
                      },
                      required: ["track_id", "friend_id", "title", "artist", "album"],
                      additionalProperties: true,
                    },
                  },
                },
                required: ["album", "tracks"],
              },
            },
          },
        },
        "400": {
          description: "Invalid payload",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "404": {
          description: "Friend not found",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "413": {
          description: "Uploaded cover art too large",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
        "500": {
          description: "Server error",
          content: { "application/json": { schema: errorResponseSchemaObject } },
        },
      },
    },
  },
  {
    operationId: "upsertAlbumWithTracks",
    method: "post",
    path: "/api/albums/upsert",
    summary: "Create or update album and tracks",
    tags: ["Albums"],
    successSchema: albumUpsertWithTracksResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                release_id: { type: "string" },
                album: { type: "string", description: "JSON stringified album payload" },
                tracks: { type: "string", description: "JSON stringified tracks payload" },
                friend_id: { type: "string" },
                cover_art: { type: "string", format: "binary" },
              },
              required: ["release_id", "album", "tracks", "friend_id"],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Album upserted",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  album: { type: "object", additionalProperties: true },
                  tracks: {
                    type: "array",
                    items: { type: "object", additionalProperties: true },
                  },
                  deletedTracks: { type: "integer" },
                },
                required: ["album", "tracks", "deletedTracks"],
              },
            },
          },
        },
        "400": {
          description: "Invalid payload",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Friend not found",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "413": {
          description: "Uploaded cover art too large",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "getAlbumsCleanupSummary",
    method: "get",
    path: "/api/albums/cleanup",
    summary: "Preview album cleanup summary",
    tags: ["Albums"],
    successSchema: albumsCleanupSummaryResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      responses: {
        "200": {
          description: "Album cleanup summary",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  totalAlbumsToClean: { type: "integer" },
                  emptyTrackCount: { type: "integer" },
                  orphanedAlbums: { type: "integer" },
                  sample: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        release_id: { type: "string" },
                        friend_id: { type: "integer" },
                        title: { type: "string" },
                        artist: { type: "string" },
                        track_count: { type: "integer" },
                      },
                      required: ["release_id", "friend_id", "title", "artist"],
                    },
                  },
                },
                required: ["totalAlbumsToClean", "emptyTrackCount", "orphanedAlbums", "sample"],
              },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "cleanupAlbums",
    method: "post",
    path: "/api/albums/cleanup",
    summary: "Run album cleanup stream",
    tags: ["Albums"],
    successSchema: z.string(),
    errorSchema: apiErrorSchema,
    openapi: {
      responses: {
        "200": {
          description: "Streaming cleanup log",
          content: {
            "text/event-stream": {
              schema: { type: "string" },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "getAlbumDiscogsRaw",
    method: "get",
    path: "/api/albums/{releaseId}/discogs-raw",
    summary: "Get raw Discogs release payload for album",
    tags: ["Albums"],
    paramsSchema: albumReleaseParamsSchema,
    querySchema: albumFriendQuerySchema,
    successSchema: albumDiscogsRawResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        {
          name: "releaseId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "friend_id",
          in: "query",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": {
          description: "Discogs raw payload",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  friend_id: { type: "integer" },
                  release_id: { type: "string" },
                  username: { type: "string" },
                  file_path: { type: "string" },
                  data: { type: "object", additionalProperties: true },
                },
                required: ["friend_id", "release_id", "username", "file_path", "data"],
              },
            },
          },
        },
        "400": {
          description: "Missing required parameters",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "404": {
          description: "Release or friend not found",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "queueAlbumDownloads",
    method: "post",
    path: "/api/albums/{releaseId}/download",
    summary: "Queue missing-track downloads for album",
    tags: ["Albums"],
    paramsSchema: albumReleaseParamsSchema,
    querySchema: albumFriendQuerySchema,
    successSchema: queueAlbumDownloadsResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      parameters: [
        {
          name: "releaseId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "friend_id",
          in: "query",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": {
          description: "Downloads queued",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  jobIds: { type: "array", items: { type: "string" } },
                  tracksQueued: { type: "integer" },
                },
                required: ["success", "message", "jobIds", "tracksQueued"],
              },
            },
          },
        },
        "400": {
          description: "Missing required parameters",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "verifyPlaylistSyncManifests",
    method: "get",
    path: "/api/discogs/verify-manifests",
    summary: "Verify playlist sync manifests",
    tags: ["Discogs"],
    successSchema: manifestVerificationResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      responses: {
        "200": {
          description: "Manifest verification report",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        username: { type: "string" },
                        totalReleaseIds: { type: "integer" },
                        missingFiles: { type: "array", items: { type: "string" } },
                        validFiles: { type: "array", items: { type: "string" } },
                      },
                      required: ["username", "totalReleaseIds", "missingFiles", "validFiles"],
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalManifests: { type: "integer" },
                      totalMissingFiles: { type: "integer" },
                      totalValidFiles: { type: "integer" },
                    },
                    required: ["totalManifests", "totalMissingFiles", "totalValidFiles"],
                  },
                },
                required: ["message", "results", "summary"],
              },
              examples: {
                manifestVerification: {
                  summary: "Playlist sync manifest verification",
                  value: manifestVerifyExample,
                },
              },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  {
    operationId: "cleanupPlaylistSyncManifests",
    method: "post",
    path: "/api/discogs/verify-manifests",
    summary: "Cleanup playlist sync manifests",
    tags: ["Discogs"],
    successSchema: manifestCleanupResponseSchema,
    errorSchema: apiErrorSchema,
    openapi: {
      responses: {
        "200": {
          description: "Manifest cleanup report",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        username: { type: "string" },
                        before: { type: "integer" },
                        after: { type: "integer" },
                        removed: { type: "array", items: { type: "string" } },
                      },
                      required: ["username", "before", "after", "removed"],
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalManifests: { type: "integer" },
                      totalRemoved: { type: "integer" },
                      totalKept: { type: "integer" },
                    },
                    required: ["totalManifests", "totalRemoved", "totalKept"],
                  },
                },
                required: ["message", "results", "summary"],
              },
              examples: {
                manifestCleanup: {
                  summary: "Playlist sync manifest cleanup",
                  value: manifestCleanupExample,
                },
              },
            },
          },
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": { schema: errorResponseSchemaObject },
          },
        },
      },
    },
  },
  ...remainingTracksContracts,
];
