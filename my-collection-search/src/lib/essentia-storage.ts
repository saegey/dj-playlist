import fs from "fs";
import path from "path";

function safePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getEssentiaDataDir(): string {
  return process.env.ESSENTIA_DATA_DIR || path.join(process.cwd(), "essentia-data");
}

export function getEssentiaAnalysisPath(trackId: string, friendId: number): string {
  const fileName = `${safePart(trackId)}_${friendId}.json`;
  return path.join(getEssentiaDataDir(), fileName);
}

export function writeEssentiaAnalysis(
  trackId: string,
  friendId: number,
  analysis: unknown
): string {
  const dir = getEssentiaDataDir();
  fs.mkdirSync(dir, { recursive: true });
  const filePath = getEssentiaAnalysisPath(trackId, friendId);
  const payload = {
    track_id: trackId,
    friend_id: friendId,
    saved_at: new Date().toISOString(),
    analysis,
  };
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
}

export function readEssentiaAnalysis(trackId: string, friendId: number): {
  file_path: string;
  payload: unknown;
} | null {
  const filePath = getEssentiaAnalysisPath(trackId, friendId);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  return {
    file_path: filePath,
    payload: JSON.parse(raw),
  };
}
