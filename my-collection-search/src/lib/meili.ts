import { MeiliSearch } from "meilisearch";

export function getMeiliClient({ server = false } = {}) {
  const host =
    (server
      ? process.env.MEILISEARCH_HOST
      : process.env.NEXT_PUBLIC_MEILISEARCH_HOST) || "https://app.vinylplay.cc:7700";
  const apiKey =
    (server
      ? process.env.MEILISEARCH_API_KEY
      : process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY) || "default_api_key";


  return new MeiliSearch({ host, apiKey });
}

// Default export for client-side usage
export const meiliClient = getMeiliClient();
