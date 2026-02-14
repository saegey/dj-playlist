import { MeiliSearch } from "meilisearch";

function resolveMeiliHost(): string {
  const raw = (process.env.MEILISEARCH_HOST || "").trim();
  const fallback = "http://localhost:7700";
  if (!raw) return fallback;

  try {
    const parsed = new URL(raw);
    if (!parsed.protocol || !parsed.hostname) return fallback;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export function getMeiliClient() {
  const host = resolveMeiliHost();
  const apiKey = process.env.MEILISEARCH_API_KEY || "mysupersecretkey";

  return new MeiliSearch({ host, apiKey });
}

// Default export for client-side usage
export const meiliClient = getMeiliClient();
