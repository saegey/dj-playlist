import type { Track } from "@/types/track";

export interface BackfillTrack extends Track {
  status?: "pending" | "analyzing" | "success" | "error";
  errorMsg?: string;
}
