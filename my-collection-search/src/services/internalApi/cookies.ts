import { z } from "zod";
import {
  gamdlCookieDeleteResponseSchema,
  gamdlCookieFileInfoSchema,
  gamdlCookieUploadResponseSchema,
} from "@/api-contract/schemas";
import { http } from "@/services/http";

const API_BASE = "/api/settings/gamdl-cookies";
const ACTIONS_BASE = "/api/settings/gamdl/actions";

export type CookieFileInfoResponse = z.infer<typeof gamdlCookieFileInfoSchema>;
export type UploadCookieResponse = z.infer<typeof gamdlCookieUploadResponseSchema>;
export type DeleteCookieResponse = z.infer<typeof gamdlCookieDeleteResponseSchema>;

export async function getCookieStatus(): Promise<CookieFileInfoResponse> {
  return await http<CookieFileInfoResponse>(ACTIONS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cookie_status" }),
  });
}

export async function uploadCookieFile(file: File): Promise<UploadCookieResponse> {
  const formData = new FormData();
  formData.append("cookieFile", file);
  return await http<UploadCookieResponse>(API_BASE, {
    method: "PUT",
    body: formData,
  });
}

export async function deleteCookieFile(): Promise<DeleteCookieResponse> {
  return await http<DeleteCookieResponse>(ACTIONS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete_cookie" }),
  });
}
