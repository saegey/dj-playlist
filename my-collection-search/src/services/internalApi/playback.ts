import { z } from "zod";
import {
  localPlaybackControlBodySchema,
  localPlaybackControlResponseSchema,
  localPlaybackStatusResponseSchema,
  localPlaybackTestResponseSchema,
} from "@/api-contract/schemas";
import { http } from "@/services/http";

export type LocalPlaybackControlBody = z.input<typeof localPlaybackControlBodySchema>;
export type LocalPlaybackControlResponse = z.infer<
  typeof localPlaybackControlResponseSchema
>;
export type LocalPlaybackStatusResponse = z.infer<
  typeof localPlaybackStatusResponseSchema
>;
export type LocalPlaybackTestResponse = z.infer<typeof localPlaybackTestResponseSchema>;

export async function controlLocalPlayback(
  body: LocalPlaybackControlBody
): Promise<LocalPlaybackControlResponse> {
  return await http<LocalPlaybackControlResponse>("/api/playback/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function fetchLocalPlaybackStatus(): Promise<LocalPlaybackStatusResponse> {
  return await http<LocalPlaybackStatusResponse>("/api/playback/local", {
    method: "GET",
    cache: "no-store",
  });
}

export async function testLocalPlayback(): Promise<LocalPlaybackTestResponse> {
  return await http<LocalPlaybackTestResponse>("/api/playback/test", {
    method: "GET",
    cache: "no-store",
  });
}
