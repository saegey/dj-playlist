import { z } from "zod";
import {
  gamdlCookieDeleteResponseSchema,
  gamdlCookieFileInfoSchema,
  gamdlCookieUploadResponseSchema,
} from "@/api-contract/schemas";
import { http } from "@/services/http";

const API_BASE = "/api/settings/gamdl-cookies";

export type CookieFileInfoResponse = z.infer<typeof gamdlCookieFileInfoSchema>;
export type UploadCookieResponse = z.infer<typeof gamdlCookieUploadResponseSchema>;
export type DeleteCookieResponse = z.infer<typeof gamdlCookieDeleteResponseSchema>;

export async function getCookieStatus(): Promise<CookieFileInfoResponse> {
  return await http<CookieFileInfoResponse>(API_BASE, { method: "GET" });
}

export async function uploadCookieFile(file: File): Promise<UploadCookieResponse> {
  const formData = new FormData();
  formData.append("cookieFile", file);
  return await http<UploadCookieResponse>(API_BASE, {
    method: "POST",
    body: formData,
  });
}

export async function deleteCookieFile(): Promise<DeleteCookieResponse> {
  return await http<DeleteCookieResponse>(API_BASE, { method: "DELETE" });
}
