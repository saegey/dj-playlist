// lib/meili.ts
import { MeiliSearch } from "meilisearch";

export function getMeiliClient({ server = false } = {}) {
  const host = server
    ? process.env.MEILISEARCH_HOST
    : process.env.NEXT_PUBLIC_MEILISEARCH_HOST || process.env.MEILISEARCH_HOST;
  const apiKey = server
    ? process.env.MEILISEARCH_API_KEY
    : process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || process.env.MEILISEARCH_API_KEY;

  if (!host) {
    throw new Error("Missing MeiliSearch host environment variable");
  }

  return new MeiliSearch({ host, apiKey });
}

// Default export for client-side usage
export const meiliClient = getMeiliClient();