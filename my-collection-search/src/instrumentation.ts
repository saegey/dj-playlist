import * as Sentry from "@sentry/nextjs";
import { startBackupScheduler } from "@/server/services/backupRunnerService";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    startBackupScheduler();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
