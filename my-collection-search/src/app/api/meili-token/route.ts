// app/api/meili-token/route.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken"; // or use meilisearch's signTenantToken helper

export async function GET(_req: NextRequest) {
  const host = process.env.MEILISEARCH_HOST!;
  const parentKey = process.env.MEILI_PARENT_KEY!;
  const parentKeyUid = process.env.MEILI_PARENT_KEY_UID!;

  //   const user = /* your auth user */ { username: "saegey" };
  const exp = Math.floor(Date.now() / 1000) + 60 * 30;

  const searchRules = {
    tracks: {
      /* optionally: filter: 'username = "saegey"' */
    },
    // or: "*": { filter: 'username = "saegey"' }
  };

  const payload = {
    searchRules,
    apiKeyUid: parentKeyUid, // <- REQUIRED in Meili v1.6+
    exp,
  };

  const token = jwt.sign(payload, parentKey, { algorithm: "HS256" });
  return Response.json({ host, token, exp });
}
