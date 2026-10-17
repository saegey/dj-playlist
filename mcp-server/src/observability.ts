import * as Sentry from "@sentry/node";
import { basename } from "node:path";

type SentryClient = Pick<typeof Sentry, "init" | "setTag">;

export function initSentry(sdk: SentryClient = Sentry): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  const release = process.env.SENTRY_RELEASE || "0.3.2";
  sdk.init({
    dsn,
    release,
    enabled: true,
    defaultIntegrations: false,
    integrations: [],
    maxBreadcrumbs: 0,
    beforeSend(event) {
      delete event.request;
      delete event.user;
      delete event.extra;
      delete event.breadcrumbs;
      for (const value of event.exception?.values ?? []) {
        value.value = "Exception details redacted";
        for (const frame of value.stacktrace?.frames ?? []) {
          if (frame.filename) frame.filename = basename(frame.filename);
          if (frame.abs_path) frame.abs_path = basename(frame.abs_path);
        }
      }
      return event;
    },
  });
  sdk.setTag("service", process.env.SENTRY_SERVICE || "mcp-server");
  sdk.setTag("release", release);
  return true;
}

export function captureException(error: unknown): void {
  if (process.env.SENTRY_DSN) Sentry.captureException(error);
}
