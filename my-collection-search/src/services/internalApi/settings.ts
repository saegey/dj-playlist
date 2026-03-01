import { z } from "zod";
import {
  aiPromptSettingsGetResponseSchema,
  aiPromptSettingsPutBodySchema,
  aiPromptSettingsPutResponseSchema,
  aiPromptSettingsQuerySchema,
  embeddingPromptSettingsGetResponseSchema,
  embeddingPromptSettingsPutBodySchema,
  embeddingPromptSettingsPutResponseSchema,
  embeddingPromptSettingsQuerySchema,
} from "@/api-contract/schemas";
import { http } from "@/services/http";

export type AiPromptSettingsQuery = z.input<typeof aiPromptSettingsQuerySchema>;
export type AiPromptSettingsResponse = z.infer<
  typeof aiPromptSettingsGetResponseSchema
>;
export type UpdateAiPromptSettingsBody = z.input<
  typeof aiPromptSettingsPutBodySchema
>;
export type UpdateAiPromptSettingsResponse = z.infer<
  typeof aiPromptSettingsPutResponseSchema
>;
export type EmbeddingPromptSettingsQuery = z.input<
  typeof embeddingPromptSettingsQuerySchema
>;
export type EmbeddingPromptSettingsResponse = z.infer<
  typeof embeddingPromptSettingsGetResponseSchema
>;
export type UpdateEmbeddingPromptSettingsBody = z.input<
  typeof embeddingPromptSettingsPutBodySchema
>;
export type UpdateEmbeddingPromptSettingsResponse = z.infer<
  typeof embeddingPromptSettingsPutResponseSchema
>;

export async function fetchAiPromptSettings(
  query: AiPromptSettingsQuery = {}
): Promise<AiPromptSettingsResponse> {
  const params = new URLSearchParams();
  if (typeof query.friend_id === "number") {
    params.set("friend_id", String(query.friend_id));
  }
  const search = params.toString();
  const path = search ? `/api/settings/ai-prompt?${search}` : "/api/settings/ai-prompt";
  return await http<AiPromptSettingsResponse>(path, {
    method: "GET",
    cache: "no-store",
  });
}

export async function updateAiPromptSettings(
  body: UpdateAiPromptSettingsBody
): Promise<UpdateAiPromptSettingsResponse> {
  return await http<UpdateAiPromptSettingsResponse>("/api/settings/ai-prompt", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function fetchEmbeddingPromptSettings(
  query: EmbeddingPromptSettingsQuery = {}
): Promise<EmbeddingPromptSettingsResponse> {
  const params = new URLSearchParams();
  if (typeof query.friend_id === "number") {
    params.set("friend_id", String(query.friend_id));
  }
  const search = params.toString();
  const path = search
    ? `/api/settings/embedding-prompt?${search}`
    : "/api/settings/embedding-prompt";
  return await http<EmbeddingPromptSettingsResponse>(path, {
    method: "GET",
    cache: "no-store",
  });
}

export async function updateEmbeddingPromptSettings(
  body: UpdateEmbeddingPromptSettingsBody
): Promise<UpdateEmbeddingPromptSettingsResponse> {
  return await http<UpdateEmbeddingPromptSettingsResponse>(
    "/api/settings/embedding-prompt",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}
