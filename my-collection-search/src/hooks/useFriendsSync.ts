// hooks/useFriendsSync.ts
"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useSyncStreams } from "@/providers/SyncStreamsProvider";
import { useSettingsDialogs } from "@/providers/SettingsDialogProvider";
import { removeFriendStream } from "@/services/internalApi/friends";

/**
 * Handles streaming removal of a friend (progress output to dialog).
 * After streaming completes, invalidates the "friends" query so the list refreshes.
 */
export function useFriendsSync() {
  const qc = useQueryClient();
  const {
    resetRemoveFriend,
    pushRemoveFriendLine,
    setRemoveFriendDone,
    setRemoveFriendError,
  } = useSyncStreams();
  const { setRemoveFriendOpen } = useSettingsDialogs();

  async function handleRemoveFriend(username: string) {
    resetRemoveFriend();
    setRemoveFriendOpen(true);

    try {
      await removeFriendStream(username, (line) => {
        pushRemoveFriendLine(line);
      });

      setRemoveFriendDone(true);

      // refresh cached friend list after removal
      await qc.invalidateQueries({ queryKey: ["friends"] });
    } catch (e: any) {
      setRemoveFriendError(e?.message ?? String(e));
      setRemoveFriendDone(true);
    }
  }

  return { handleRemoveFriend };
}