import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  console.log("Range header:", request.headers.get("range"));
  const filename = searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }
  const audioDir = path.resolve("audio");
  const filePath = path.join(audioDir, filename);

  if (
    !filename ||
    !fs.existsSync(filePath) ||
    fs.statSync(filePath).isDirectory()
  ) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const stat = fs.statSync(filePath);
    const nodeStream = fs.createReadStream(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "audio/mpeg";
    if (ext === ".wav") contentType = "audio/wav";
    if (ext === ".m4a") contentType = "audio/mp4";

    // Convert Node.js stream to a web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    console.error("Error streaming file:", err);
    return NextResponse.json(
      { error: "Error streaming file" },
      { status: 500 }
    );
  }
}
