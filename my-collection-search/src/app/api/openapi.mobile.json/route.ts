import { NextResponse } from "next/server";
import { getMobileOpenApiDocument } from "@/api-contract/openapi";

export async function GET() {
  return NextResponse.json(getMobileOpenApiDocument(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
