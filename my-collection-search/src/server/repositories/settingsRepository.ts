import { dbQuery } from "@/lib/serverDb";
import type { GamdlSettings, GamdlSettingsUpdate } from "@/types/gamdl";

const GAMDL_ALLOWED_FIELDS = [
  "audio_quality",
  "audio_format",
  "save_cover",
  "cover_format",
  "save_lyrics",
  "lyrics_format",
  "overwrite_existing",
  "skip_music_videos",
  "max_retries",
] as const;

type GamdlField = (typeof GAMDL_ALLOWED_FIELDS)[number];

export class SettingsRepository {
  async findAiPromptByFriendId(friendId: number): Promise<string | null> {
    const { rows } = await dbQuery<{ prompt: string | null }>(
      "SELECT prompt FROM ai_prompt_settings WHERE friend_id = $1 LIMIT 1",
      [friendId]
    );
    return typeof rows[0]?.prompt === "string" ? rows[0].prompt : null;
  }

  async upsertAiPrompt(friendId: number, prompt: string): Promise<string> {
    const { rows } = await dbQuery<{ prompt: string }>(
      `
      INSERT INTO ai_prompt_settings (friend_id, prompt, updated_at)
      VALUES ($1, $2, current_timestamp)
      ON CONFLICT (friend_id)
      DO UPDATE SET prompt = EXCLUDED.prompt, updated_at = current_timestamp
      RETURNING prompt
      `,
      [friendId, prompt]
    );
    return rows[0]?.prompt ?? prompt;
  }

  async deleteAiPrompt(friendId: number): Promise<void> {
    await dbQuery("DELETE FROM ai_prompt_settings WHERE friend_id = $1", [
      friendId,
    ]);
  }

  async findEmbeddingTemplateByFriendId(friendId: number): Promise<string | null> {
    const { rows } = await dbQuery<{ prompt_template: string | null }>(
      "SELECT prompt_template FROM embedding_prompt_settings WHERE friend_id = $1 LIMIT 1",
      [friendId]
    );
    return typeof rows[0]?.prompt_template === "string"
      ? rows[0].prompt_template
      : null;
  }

  async upsertEmbeddingTemplate(friendId: number, template: string): Promise<string> {
    const { rows } = await dbQuery<{ prompt_template: string }>(
      `
      INSERT INTO embedding_prompt_settings (friend_id, prompt_template, updated_at)
      VALUES ($1, $2, current_timestamp)
      ON CONFLICT (friend_id)
      DO UPDATE SET prompt_template = EXCLUDED.prompt_template, updated_at = current_timestamp
      RETURNING prompt_template
      `,
      [friendId, template]
    );
    return rows[0]?.prompt_template ?? template;
  }

  async deleteEmbeddingTemplate(friendId: number): Promise<void> {
    await dbQuery(
      "DELETE FROM embedding_prompt_settings WHERE friend_id = $1",
      [friendId]
    );
  }

  async ensureGamdlSettings(friendId: number): Promise<void> {
    await dbQuery(
      `
      INSERT INTO gamdl_settings (friend_id)
      VALUES ($1)
      ON CONFLICT (friend_id) DO NOTHING
      `,
      [friendId]
    );
  }

  async findGamdlSettingsByFriendId(friendId: number): Promise<GamdlSettings | null> {
    const { rows } = await dbQuery<GamdlSettings>(
      "SELECT * FROM gamdl_settings WHERE friend_id = $1 LIMIT 1",
      [friendId]
    );
    return rows[0] ?? null;
  }

  async updateGamdlSettings(
    friendId: number,
    updates: GamdlSettingsUpdate
  ): Promise<GamdlSettings | null> {
    const entries = Object.entries(updates).filter(
      ([key, value]) =>
        value !== undefined &&
        GAMDL_ALLOWED_FIELDS.includes(key as GamdlField)
    );

    if (entries.length === 0) {
      return null;
    }

    const setClause = entries
      .map(([field], index) => `${field} = $${index + 2}`)
      .join(", ");
    const values = [friendId, ...entries.map(([, value]) => value)];

    const { rows } = await dbQuery<GamdlSettings>(
      `
      UPDATE gamdl_settings
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE friend_id = $1
      RETURNING *
      `,
      values
    );

    return rows[0] ?? null;
  }

  async resetGamdlSettings(friendId: number): Promise<GamdlSettings | null> {
    await dbQuery("DELETE FROM gamdl_settings WHERE friend_id = $1", [friendId]);
    const { rows } = await dbQuery<GamdlSettings>(
      `
      INSERT INTO gamdl_settings (friend_id)
      VALUES ($1)
      RETURNING *
      `,
      [friendId]
    );
    return rows[0] ?? null;
  }
}

export const settingsRepository = new SettingsRepository();
