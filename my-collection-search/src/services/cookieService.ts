import { CookieFileInfo } from "@/lib/cookieUtils";

const API_BASE = "/api/settings/gamdl-cookies";

export interface UploadCookieResponse {
  success: boolean;
  message: string;
  cookieInfo: CookieFileInfo;
}

export interface DeleteCookieResponse {
  success: boolean;
  message: string;
}

/**
 * Get current cookie file status
 */
export async function getCookieStatus(): Promise<CookieFileInfo> {
  const response = await fetch(API_BASE);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || "Failed to get cookie status");
  }

  return response.json();
}

/**
 * Upload a new cookie file
 */
export async function uploadCookieFile(file: File): Promise<UploadCookieResponse> {
  const formData = new FormData();
  formData.append("cookieFile", file);

  const response = await fetch(API_BASE, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || "Failed to upload cookie file");
  }

  return response.json();
}

/**
 * Delete the current cookie file
 */
export async function deleteCookieFile(): Promise<DeleteCookieResponse> {
  const response = await fetch(API_BASE, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || "Failed to delete cookie file");
  }

  return response.json();
}