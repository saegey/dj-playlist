import { http } from "./http";

export type RestoreDatabaseResponse = {
  message?: string;
  [k: string]: unknown;
};

export async function restoreDatabase(file: File): Promise<RestoreDatabaseResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return await http<RestoreDatabaseResponse>("/api/restore", {
    method: "POST",
    body: formData,
  });
}
