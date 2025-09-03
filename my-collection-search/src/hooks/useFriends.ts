import { useCallback, useEffect, useState } from "react";

interface UseFriendsOptions {
  showCurrentUser?: boolean;
  showSpotifyUsernames?: boolean;
}

export function useFriends({
  showCurrentUser = false,
  showSpotifyUsernames = false,
}: UseFriendsOptions = {}) {
  const [friends, setFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(
    async (showCurrentUser: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/friends?showCurrentUser=${showCurrentUser}&showSpotifyUsernames=${showSpotifyUsernames}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unknown error");
        setFriends(data.friends || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [showSpotifyUsernames]
  );

  /**
   * Add a friend and stream progress updates using Server-Sent Events (SSE).
   * @param username The friend's username to add
   * @param onProgress Optional callback for streaming progress messages
   */
  const addFriend = useCallback(
    async (
      username: string,
      onProgress?: (message: string) => void
    ) => {
      setLoading(true);
      setError(null);
      let eventSource: EventSource | null = null;
      try {
        // Use SSE endpoint for streaming progress
        eventSource = new EventSource(`/api/friends/stream-add?username=${encodeURIComponent(username)}`);
        await new Promise<void>((resolve, reject) => {
          eventSource!.onmessage = (event) => {
            if (onProgress) onProgress(event.data);
            // Convention: server sends { done: true } as JSON when finished
            try {
              const parsed = JSON.parse(event.data);
              if (parsed.done) {
                resolve();
              }
            } catch {
              // Not JSON, just a message
            }
          };
          eventSource!.onerror = () => {
            eventSource!.close();
            reject(new Error("Error receiving progress updates"));
          };
        });
        await fetchFriends();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (eventSource) eventSource.close();
        setLoading(false);
      }
    },
    [fetchFriends]
  );

  const removeFriend = useCallback(
    async (username: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/friends?username=${encodeURIComponent(username)}`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unknown error");
        await fetchFriends();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [fetchFriends]
  );

  useEffect(() => {
    fetchFriends(showCurrentUser);
  }, [fetchFriends, showCurrentUser]);

  return { friends, loading, error, fetchFriends, addFriend, removeFriend };
}
