import OpenAI from "openai";
import { Track } from "@/types/track";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
    ? process.env.OPENAI_API_KEY
    : "My API Key",
});

export function buildTrackPrompt(track: Track): string {
  const parts = [];
  parts.push(`Style: ${track.local_tags}`);
  // if (track.styles?.length) {
  //   parts.push(
  //     `The album features ${track.styles.join(", ")} styles with ${
  //       track.genres?.join(", ") ?? "genre-unspecified"
  //     } genres.`
  //   );
  // }
  if (track.key) {
    parts.push(`Key: ${track.key}`);
  }
  if (track.bpm) {
    parts.push(`BPM: ${track.bpm} `);
  }

  if (track.danceability != null) {
    parts.push(`Danceability score: ${track.danceability} out of 2.0`);
  }
  if (track.mood_happy != null) {
    parts.push(`Moody: ${track.mood_happy > 0.5 ? "happy" : "moody"}.`);
  }
  if (track.notes) {
    const cleanedNotes = track.notes.replace(
      /^["“”'].*?["“”']\s*/,
      "This track "
    ).replace(/\[[^\]]+\]\([^)]+\)/g, "");
    parts.push(`Notes: ${cleanedNotes}`);
  }
  return parts.join("\n");
}

export async function getTrackEmbedding(track: Track): Promise<number[]> {
  const prompt = buildTrackPrompt(track);
  console.log("Generating embedding for prompt:", prompt);
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: prompt,
  });
  return embeddingRes.data[0].embedding;
}
