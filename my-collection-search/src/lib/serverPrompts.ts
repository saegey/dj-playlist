import fs from "fs";
import path from "path";
import { Pool } from "pg";

const PROMPT_PATH = path.join(
  process.cwd(),
  "content",
  "prompts",
  "track-metadata.txt"
);

let cachedDefaultPrompt: string | null = null;

export function getDefaultTrackMetadataPrompt(): string {
  if (cachedDefaultPrompt) return cachedDefaultPrompt;
  try {
    const text = fs.readFileSync(PROMPT_PATH, "utf-8").trim();
    cachedDefaultPrompt = text;
    return text;
  } catch (err) {
    console.error("Failed to read default prompt file:", err);
    return "You are a DJ music metadata assistant.";
  }
}

export async function getTrackMetadataPromptForFriend(
  friendId?: number
): Promise<string> {
  const defaultPrompt = getDefaultTrackMetadataPrompt();
  if (!friendId || Number.isNaN(friendId)) return defaultPrompt;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(
      "SELECT prompt FROM ai_prompt_settings WHERE friend_id = $1",
      [friendId]
    );
    if (rows.length > 0 && typeof rows[0].prompt === "string") {
      return rows[0].prompt;
    }
    return defaultPrompt;
  } catch (err) {
    console.error("Failed to fetch AI prompt settings:", err);
    return defaultPrompt;
  } finally {
    await pool.end();
  }
}
