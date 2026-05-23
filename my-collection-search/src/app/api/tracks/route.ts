import { NextResponse } from "next/server";
import { getTrackEmbedding } from "@/lib/track-embedding";
import { generateAndStoreAudioVibeEmbedding } from "@/lib/audio-vibe-embedding";
import { generateAndStoreIdentityEmbedding } from "@/lib/identity-embedding";
import { getPostHogClient } from "@/lib/posthog-server";
import {
  trackRepository,
  type TrackWithLibraryIdentifierRow,
  type UpdateTrackInput,
} from "@/server/repositories/trackRepository";

export async function PATCH(req: Request) {
  try {
    const data = (await req.json()) as UpdateTrackInput;
    const current = await trackRepository.findTrackByTrackIdAndFriendId(
      data.track_id,
      data.friend_id
    );

    const updated = await trackRepository.updateTrackFields(data);
    if (!updated) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const promptFields: Array<keyof TrackWithLibraryIdentifierRow> = [
      "local_tags",
      "styles",
      "genres",
      "bpm",
      "key",
      "danceability",
      "mood_happy",
      "notes",
    ];
    let shouldUpdateEmbedding = false;
    for (const field of promptFields) {
      const before = current?.[field];
      const after = updated?.[field];
      if (Array.isArray(before) || Array.isArray(after)) {
        const beforeArr = Array.isArray(before) ? before : [];
        const afterArr = Array.isArray(after) ? after : [];
        if (beforeArr.join() !== afterArr.join()) {
          shouldUpdateEmbedding = true;
          break;
        }
      } else if (before !== after) {
        shouldUpdateEmbedding = true;
        break;
      }
    }

    const identityFields: Array<keyof TrackWithLibraryIdentifierRow> = [
      "title",
      "artist",
      "album",
      "year",
      "genres",
      "styles",
      "local_tags",
      "composer",
    ];
    const audioVibeFields: Array<keyof TrackWithLibraryIdentifierRow> = [
      "bpm",
      "key",
      "danceability",
      "mood_happy",
      "mood_sad",
      "mood_relaxed",
      "mood_aggressive",
    ];
    const fieldsChanged = (
      fields: Array<keyof TrackWithLibraryIdentifierRow>
    ): boolean => {
      for (const field of fields) {
        const before = current?.[field];
        const after = updated?.[field];
        if (Array.isArray(before) || Array.isArray(after)) {
          const beforeArr = Array.isArray(before) ? before : [];
          const afterArr = Array.isArray(after) ? after : [];
          if (beforeArr.join() !== afterArr.join()) return true;
          continue;
        }
        if (before !== after) return true;
      }
      return false;
    };

    if (shouldUpdateEmbedding) {
      try {
        const embedding = await getTrackEmbedding(updated);
        await trackRepository.updateTrackEmbedding(
          updated.track_id,
          updated.friend_id,
          embedding
        );
        updated.embedding = embedding;
      } catch (embedError) {
        console.error("Failed to update embedding:", embedError);
      }
    }

    if (fieldsChanged(identityFields)) {
      try {
        await generateAndStoreIdentityEmbedding(updated.track_id, updated.friend_id);
      } catch (identityError) {
        console.error("Failed to update identity embedding:", identityError);
      }
    }

    if (fieldsChanged(audioVibeFields)) {
      try {
        await generateAndStoreAudioVibeEmbedding(updated.track_id, updated.friend_id);
      } catch (audioVibeError) {
        console.error("Failed to update audio vibe embedding:", audioVibeError);
      }
    }

    try {
      const posthog = getPostHogClient();
      const changedFields = Object.keys(data).filter(
        (key) => key !== "track_id" && key !== "friend_id"
      );
      posthog.capture({
        distinctId: "server",
        event: "track_edited",
        properties: {
          track_id: updated.track_id,
          changed_fields: changedFields,
          has_rating_change: "star_rating" in data,
          has_notes_change: "notes" in data,
          has_tags_change: "local_tags" in data,
          source: "api",
        },
      });
    } catch (posthogError) {
      console.error("PostHog capture error:", posthogError);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating track:", error);
    return NextResponse.json(
      { error: "Failed to update track" },
      { status: 500 }
    );
  }
}
