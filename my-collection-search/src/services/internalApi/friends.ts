import { streamLines } from "../sse";

export async function removeFriendStream(
  username: string,
  onLine: (line: string) => void
) {
  const url = `/api/friends?username=${encodeURIComponent(username)}`;
  await streamLines(url, { method: "DELETE" }, onLine);
}

export async function addFriendApi(username: string) {
  const res = await fetch("/api/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  return data;
}

export async function removeFriendApi(username: string) {
  const res = await fetch(
    `/api/friends?username=${encodeURIComponent(username)}`,
    {
      method: "DELETE",
    }
  );
  const data = await res.json();
  return data;
}

export async function fetchFriends(
  showCurrentUser?: false,
  showSpotifyUsernames?: false
) {
  const res = await fetch(
    `/api/friends?showCurrentUser=${showCurrentUser}&showSpotifyUsernames=${showSpotifyUsernames}`
  );
  const data = await res.json();
  return data;
}
