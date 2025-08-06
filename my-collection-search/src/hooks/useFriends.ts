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

  const addFriend = useCallback(
    async (username: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
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
