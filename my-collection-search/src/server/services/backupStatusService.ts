import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BackupStatus } from "@/types/backup";

const DUMPS_DIR = path.resolve(
  process.env.BACKUP_STATUS_DIR ||
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../dumps")
);
const STATUS_PATH = path.join(DUMPS_DIR, "backup-status.json");

function ensureDumpsDir(): void {
  if (!fs.existsSync(DUMPS_DIR)) {
    fs.mkdirSync(DUMPS_DIR, { recursive: true });
  }
}

export class BackupStatusService {
  getStatus(): BackupStatus | null {
    if (!fs.existsSync(STATUS_PATH)) {
      return null;
    }

    const raw = fs.readFileSync(STATUS_PATH, "utf8");
    return JSON.parse(raw) as BackupStatus;
  }

  writeStatus(status: Omit<BackupStatus, "stored_at">): BackupStatus {
    ensureDumpsDir();

    const nextStatus: BackupStatus = {
      ...status,
      stored_at: new Date().toISOString(),
    };

    fs.writeFileSync(STATUS_PATH, `${JSON.stringify(nextStatus, null, 2)}\n`, "utf8");
    return nextStatus;
  }
}

export const backupStatusService = new BackupStatusService();
