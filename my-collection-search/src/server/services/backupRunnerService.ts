import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { backupPolicyService } from "@/server/services/backupPolicyService";
import type { BackupPolicy, BackupRetentionPreset } from "@/types/backup";

const execFileAsync = promisify(execFile);

type BackupRunResult = {
  startedAt: string;
  finishedAt: string;
  status: "success" | "failed" | "skipped";
  reason: string;
  snapshotOutput?: string;
  pruneOutput?: string;
  error?: string;
};

const GLOBAL_SCHEDULER_KEY = "__groovenetBackupSchedulerStarted";
const GLOBAL_LAST_TICK_MINUTE_KEY = "__groovenetBackupSchedulerLastMinute";
const GLOBAL_BACKUP_RUNNING_KEY = "__groovenetBackupRunning";

type GlobalWithBackup = typeof globalThis & {
  [GLOBAL_SCHEDULER_KEY]?: boolean;
  [GLOBAL_LAST_TICK_MINUTE_KEY]?: string;
  [GLOBAL_BACKUP_RUNNING_KEY]?: boolean;
};

function getExistingPath(p: string): string | null {
  return fs.existsSync(p) ? p : null;
}

function retentionArgs(preset: BackupRetentionPreset): string[] {
  if (preset === "aggressive") {
    return ["--keep-hourly", "24", "--keep-daily", "7"];
  }
  if (preset === "archive") {
    return [
      "--keep-daily",
      "30",
      "--keep-weekly",
      "26",
      "--keep-monthly",
      "24",
      "--keep-yearly",
      "5",
    ];
  }
  return [
    "--keep-hourly",
    "48",
    "--keep-daily",
    "30",
    "--keep-weekly",
    "12",
    "--keep-monthly",
    "12",
  ];
}

function parseCronField(field: string, value: number): boolean {
  const trimmed = field.trim();
  if (trimmed === "*") return true;

  const parts = trimmed.split(",");
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    if (p.startsWith("*/")) {
      const step = Number(p.slice(2));
      if (Number.isInteger(step) && step > 0 && value % step === 0) return true;
      continue;
    }
    const num = Number(p);
    if (Number.isInteger(num) && num === value) return true;
  }
  return false;
}

function cronMatches(cron: string, now: Date): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [min, hour, day, month, dow] = parts;
  const values = [
    now.getUTCMinutes(),
    now.getUTCHours(),
    now.getUTCDate(),
    now.getUTCMonth() + 1,
    now.getUTCDay(),
  ];
  return (
    parseCronField(min, values[0]) &&
    parseCronField(hour, values[1]) &&
    parseCronField(day, values[2]) &&
    parseCronField(month, values[3]) &&
    parseCronField(dow, values[4])
  );
}

function requiredEnvConfigured(): { ok: boolean; missing: string[] } {
  const required = ["RESTIC_REPOSITORY", "RESTIC_PASSWORD"];
  const missing = required.filter((name) => !process.env[name]);
  return { ok: missing.length === 0, missing };
}

async function createDatabaseDump(): Promise<string> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const pg = new URL(databaseUrl);
  const dumpsDir = path.resolve(process.cwd(), "dumps");
  fs.mkdirSync(dumpsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dumpPath = path.join(dumpsDir, `pg-backup-${stamp}.dump`);

  const args = [
    "-h",
    pg.hostname,
    "-p",
    pg.port || "5432",
    "-U",
    decodeURIComponent(pg.username),
    "-F",
    "c",
    "-d",
    pg.pathname.replace(/^\//, ""),
    "-f",
    dumpPath,
  ];

  await execFileAsync("pg_dump", args, {
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(pg.password),
    },
    maxBuffer: 1024 * 1024 * 10,
  });

  return dumpPath;
}

function collectBackupPaths(policy: BackupPolicy): string[] {
  const paths: string[] = [];

  if (policy.include_database) {
    const dumpsPath = getExistingPath(path.resolve(process.cwd(), "dumps"));
    if (dumpsPath) paths.push(dumpsPath);
  }
  if (policy.include_audio_files) {
    const audioPath = getExistingPath(path.resolve(process.cwd(), "audio"));
    if (audioPath) paths.push(audioPath);
  }
  if (policy.include_album_covers) {
    const coversPath = getExistingPath(
      path.resolve(process.cwd(), "public/uploads/album-covers")
    );
    if (coversPath) paths.push(coversPath);
  }
  if (policy.include_uploads) {
    const uploadsPath = getExistingPath(path.resolve(process.cwd(), "uploads"));
    if (uploadsPath) paths.push(uploadsPath);
  }

  return paths;
}

export async function runBackupNow(
  reason: "manual" | "scheduled" = "manual"
): Promise<BackupRunResult> {
  const g = globalThis as GlobalWithBackup;
  const startedAt = new Date().toISOString();

  if (g[GLOBAL_BACKUP_RUNNING_KEY]) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "skipped",
      reason: "backup-already-running",
    };
  }

  g[GLOBAL_BACKUP_RUNNING_KEY] = true;
  try {
    const policy = backupPolicyService.getPolicy();
    if (reason === "scheduled" && !policy.enabled) {
      return {
        startedAt,
        finishedAt: new Date().toISOString(),
        status: "skipped",
        reason: "policy-disabled",
      };
    }

    const envCheck = requiredEnvConfigured();
    if (!envCheck.ok) {
      return {
        startedAt,
        finishedAt: new Date().toISOString(),
        status: "failed",
        reason: "missing-env",
        error: `Missing env vars: ${envCheck.missing.join(", ")}`,
      };
    }

    if (policy.include_database) {
      await createDatabaseDump();
    }

    const backupPaths = collectBackupPaths(policy);
    if (backupPaths.length === 0) {
      return {
        startedAt,
        finishedAt: new Date().toISOString(),
        status: "skipped",
        reason: "no-paths-selected",
      };
    }

    const tag = `groovenet-${reason}`;
    const snapshot = await execFileAsync(
      "restic",
      ["backup", ...backupPaths, "--tag", tag, "--json"],
      { env: process.env, maxBuffer: 1024 * 1024 * 10 }
    );

    const prune = await execFileAsync(
      "restic",
      ["forget", "--prune", ...retentionArgs(policy.retention_preset)],
      { env: process.env, maxBuffer: 1024 * 1024 * 10 }
    );

    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "success",
      reason,
      snapshotOutput: `${snapshot.stdout || ""}${snapshot.stderr || ""}`.trim(),
      pruneOutput: `${prune.stdout || ""}${prune.stderr || ""}`.trim(),
    };
  } catch (error) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "failed",
      reason,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    g[GLOBAL_BACKUP_RUNNING_KEY] = false;
  }
}

async function scheduledTick(): Promise<void> {
  const g = globalThis as GlobalWithBackup;
  const now = new Date();
  const minuteKey = now.toISOString().slice(0, 16);
  if (g[GLOBAL_LAST_TICK_MINUTE_KEY] === minuteKey) return;
  g[GLOBAL_LAST_TICK_MINUTE_KEY] = minuteKey;

  const policy = backupPolicyService.getPolicy();
  if (!policy.enabled) return;
  if (!cronMatches(policy.schedule_cron, now)) return;

  const result = await runBackupNow("scheduled");
  if (result.status === "failed") {
    console.error("[backup-scheduler] backup failed:", result.error);
  } else if (result.status === "success") {
    console.log("[backup-scheduler] backup succeeded at", result.finishedAt);
  }
}

export function startBackupScheduler(): void {
  const g = globalThis as GlobalWithBackup;
  if (g[GLOBAL_SCHEDULER_KEY]) return;
  g[GLOBAL_SCHEDULER_KEY] = true;

  void scheduledTick();
  setInterval(() => {
    void scheduledTick();
  }, 60_000);

  console.log("[backup-scheduler] started");
}
