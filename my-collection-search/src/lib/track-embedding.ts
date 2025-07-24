import OpenAI from "openai";
import { Track } from "@/types/track";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
    ? process.env.OPENAI_API_KEY
    : "My API Key",
});

export function buildTrackPrompt(track: Track): string {
  const parts = [];
  parts.push(`The song style is ${track.local_tags}`);
  if (track.styles?.length) {
    parts.push(
      `The album features ${track.styles.join(", ")} styles with ${
        track.genres?.join(", ") ?? "genre-unspecified"
      } genres.`
    );
  }
  if (track.bpm) {
    parts.push(
      `The tempo is ${track.bpm} BPM in key ${track.key || "unknown"}.`
    );
  }
  if (track.danceability != null) {
    parts.push(`Danceability is rated ${track.danceability}.`);
  }
  if (track.mood_happy != null) {
    parts.push(
      `Overall mood is ${track.mood_happy > 0.5 ? "happy" : "moody"}.`
    );
  }
  if (track.notes) {
    parts.push(`Some DJ notes: ${track.notes}`);
  }
  return parts.join(" ");
}

export async function getTrackEmbedding(track: Track): Promise<number[]> {
  const prompt = buildTrackPrompt(track);
  console.log("Generating embedding for prompt:", prompt);
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: prompt,
  });
  return embeddingRes.data[0].embedding;
}
