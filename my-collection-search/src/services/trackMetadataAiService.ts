import OpenAI from "openai";
import { getTrackMetadataPromptForFriend } from "@/lib/serverPrompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PRIMARY_MODEL = process.env.OPENAI_TRACK_METADATA_MODEL || "gpt-5-mini";
const FALLBACK_MODEL =
  process.env.OPENAI_TRACK_METADATA_FALLBACK_MODEL || "gpt-4.1-mini";
const SEARCH_MODEL =
  process.env.OPENAI_TRACK_METADATA_SEARCH_MODEL || PRIMARY_MODEL;
const HARD_GUARDRAILS = `
Non-negotiable rules:
- Do not guess genre, vibe, energy, BPM, or cultural context from title/artist alone.
- Use cautious wording unless facts are verifiable.
- Avoid generic hype language (e.g., "peak-time", "pulsating beat", "driven energy") unless explicitly supported.
- Keep "notes" concise (1-3 sentences), practical for DJs, and evidence-aware.
- If information is uncertain after checking available context, set uncertain fields to empty strings and explain uncertainty briefly in notes.
- If multiple artists could match the same name/title combination, treat the result as ambiguous.
- Do not claim nationality, era, or scene unless the exact artist-track match is clear.
`.trim();

const metadataSchema = {
  type: "json_schema" as const,
  name: "track_metadata",
  schema: {
    type: "object",
    properties: {
      genre: { type: "string" },
      notes: { type: "string" },
      needs_search: { type: "boolean" },
      artist_match_confidence: { type: "string", enum: ["high", "low"] },
    },
    required: ["genre", "notes", "needs_search", "artist_match_confidence"],
    additionalProperties: false,
  },
  strict: true,
};

type MetadataResult = {
  genre: string;
  notes: string;
  needs_search: boolean;
  artist_match_confidence: "high" | "low";
};

export class TrackMetadataError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "TrackMetadataError";
    this.status = status;
  }
}

function parseMetadataFromResponse(
  response: Awaited<ReturnType<typeof openai.responses.create>>
): MetadataResult {
  const candidates: string[] = [];

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    candidates.push(response.output_text.trim());
  }

  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const content of item.content ?? []) {
      if (content.type !== "output_text") continue;

      // Some SDK/parser paths include parsed JSON directly on content.
      const parsed = (content as unknown as { parsed?: unknown }).parsed;
      if (parsed && typeof parsed === "object") {
        const maybe = parsed as Partial<MetadataResult>;
        if (
          typeof maybe.genre === "string" &&
          typeof maybe.notes === "string" &&
          typeof maybe.needs_search === "boolean" &&
          (maybe.artist_match_confidence === "high" ||
            maybe.artist_match_confidence === "low")
        ) {
          return maybe as MetadataResult;
        }
      }

      if (typeof content.text === "string" && content.text.trim()) {
        candidates.push(content.text.trim());
      }
    }
  }

  for (const text of candidates) {
    try {
      return JSON.parse(text) as MetadataResult;
    } catch {
      // Try the next candidate.
    }
  }

  throw new TrackMetadataError(
    "Model returned non-JSON output for track metadata"
  );
}

async function fetchMetadata(
  systemPrompt: string,
  prompt: string,
  useSearch: boolean
): Promise<MetadataResult> {
  const model = useSearch ? SEARCH_MODEL : PRIMARY_MODEL;
  const fallbackModel = FALLBACK_MODEL;
  const baseRequest = {
    model,
    input: [
      {
        role: "system" as const,
        content: `${systemPrompt}\n\n${HARD_GUARDRAILS}`,
      },
      { role: "user" as const, content: prompt },
    ],
    ...(useSearch
      ? {
          tools: [{ type: "web_search" as const }],
          tool_choice: "required" as const,
        }
      : {}),
    text: { format: metadataSchema },
    max_output_tokens: 200,
  };

  try {
    const response = await openai.responses.create(baseRequest);
    return parseMetadataFromResponse(response);
  } catch (error) {
    const err = error as { message?: string; status?: number };
    const shouldFallback =
      fallbackModel &&
      fallbackModel !== model &&
      (err.status === 404 ||
        err.status === 400 ||
        /model|unsupported|not found/i.test(err.message || ""));

    if (!shouldFallback) {
      throw error;
    }

    console.warn(
      `[track-metadata] model '${model}' failed (${err.status ?? "unknown"}), retrying with '${fallbackModel}'`
    );

    const retryResponse = await openai.responses.create({
      ...baseRequest,
      model: fallbackModel,
    });
    return parseMetadataFromResponse(retryResponse);
  }
}

export async function generateTrackMetadata(args: {
  prompt: string;
  friendId?: number;
}): Promise<{ genre: string; notes: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new TrackMetadataError("Missing OPENAI_API_KEY env variable", 500);
  }
  if (typeof args.prompt !== "string" || args.prompt.trim().length === 0) {
    throw new TrackMetadataError("Missing or invalid prompt", 400);
  }

  const systemPrompt = await getTrackMetadataPromptForFriend(args.friendId);

  let result: MetadataResult;
  try {
    // Prefer search-backed metadata first to avoid generic hallucinated descriptions.
    result = await fetchMetadata(systemPrompt, args.prompt.trim(), true);
  } catch (error) {
    console.warn(
      "[track-metadata] search-backed pass failed, retrying without search:",
      error
    );
    result = await fetchMetadata(systemPrompt, args.prompt.trim(), false);
  }

  if (result.needs_search) {
    console.warn("[track-metadata] model signaled unresolved uncertainty");
  }

  if (result.artist_match_confidence !== "high") {
    return {
      genre: "",
      notes:
        "Could not confidently identify the exact artist/recording from available context. Add album/year or a source URL and retry.",
    };
  }

  return { notes: result.notes, genre: result.genre };
}
