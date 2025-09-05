import { http } from "../http";

export function backupDatabase() {
  return http<{ message: string }>("/api/backup", { method: "POST" });
}

export function fetchBackups() {
  return http<{ files: Array<string> }>(
    "/api/backups",
    { method: "GET" }
  );
}
