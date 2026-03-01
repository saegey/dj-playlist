import { NextResponse } from "next/server";
import { getOpenApiDocument } from "@/api-contract/openapi";

export async function GET() {
  return NextResponse.json(getOpenApiDocument(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
