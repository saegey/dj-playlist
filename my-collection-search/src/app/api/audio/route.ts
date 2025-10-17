import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const range = request.headers.get("range");
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }

  const audioDir = path.resolve("audio");
  const filePath = path.join(audioDir, filename);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const totalSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  let contentType = "audio/mpeg";
  if (ext === ".wav") contentType = "audio/wav";
  if (ext === ".m4a") contentType = "audio/mp4";

  // If no Range header, just stream the whole file
  if (!range) {
    const nodeStream = fs.createReadStream(filePath);
    const readableStream = new ReadableStream({
      start(ctrl) {
        function cleanup() {
          nodeStream.removeAllListeners("data");
          nodeStream.removeAllListeners("end");
          nodeStream.removeAllListeners("error");
        }
        nodeStream.on("data", (chunk) => {
          try {
            ctrl.enqueue(chunk);
          } catch {
            cleanup();
            nodeStream.destroy();
          }
        });
        nodeStream.once("end", () => {
          cleanup();
          try { ctrl.close(); } catch {}
        });
        nodeStream.once("error", (err) => {
          cleanup();
          try { ctrl.error(err); } catch {}
        });
      },
      cancel() {
        nodeStream.destroy();
      },
    });
    return new Response(readableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": totalSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  }

  // Parse "bytes=start-end"
  const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
  const start = parseInt(startStr, 10);
  let end = endStr ? parseInt(endStr, 10) : totalSize - 1;

  // Validate and clamp range values
  if (isNaN(start) || start < 0) {
    return NextResponse.json({ error: "Invalid range start" }, { status: 416 });
  }
  if (start >= totalSize) {
    return NextResponse.json({ error: "Range start beyond file size" }, { status: 416 });
  }

  // Clamp end to valid range
  end = Math.min(end, totalSize - 1);

  // Ensure start <= end
  if (start > end) {
    return NextResponse.json({ error: "Invalid range: start > end" }, { status: 416 });
  }

  const chunkSize = end - start + 1;

  // Create a stream for just the requested range
  const nodeStream = fs.createReadStream(filePath, { start, end });
  const readableStream = new ReadableStream({
    start(ctrl) {
      function cleanup() {
        nodeStream.removeAllListeners("data");
        nodeStream.removeAllListeners("end");
        nodeStream.removeAllListeners("error");
      }
      nodeStream.on("data", (chunk) => {
        try {
          ctrl.enqueue(chunk);
        } catch {
          cleanup();
          nodeStream.destroy();
        }
      });
      nodeStream.once("end", () => {
        cleanup();
        try { ctrl.close(); } catch {}
      });
      nodeStream.once("error", (err) => {
        cleanup();
        try { ctrl.error(err); } catch {}
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(readableStream, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": chunkSize.toString(),
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}