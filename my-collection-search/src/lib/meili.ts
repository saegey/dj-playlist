import { MeiliSearch } from "meilisearch";

export function getMeiliClient() {
  const host = process.env.MEILISEARCH_HOST || "http://localhost:7700";
  const apiKey = process.env.MEILISEARCH_API_KEY  || "mysupersecretkey";

  return new MeiliSearch({ host, apiKey });
}

// Default export for client-side usage
export const meiliClient = getMeiliClient();
