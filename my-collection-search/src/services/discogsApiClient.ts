import type { DiscogsReleaseDetails } from "@/types/discogs";
export type {
  DiscogsArtist,
  DiscogsLabel,
  DiscogsCompany,
  DiscogsFormat,
  DiscogsCommunity,
  DiscogsIdentifier,
  DiscogsApiTrack,
  DiscogsVideo,
  DiscogsExtraArtist,
  DiscogsImage,
  DiscogsReleaseDetails,
} from "@/types/discogs";

const DISCOGS_USER_TOKEN = process.env.DISCOGS_USER_TOKEN;
const FOLDER_ID = process.env.DISCOGS_FOLDER_ID || 0; // 0 means "All" folder

export async function getCollectionPage(
  username: string,
  page: number = 1,
  perPage = 100
) {
  const urlBase = `https://api.discogs.com/users/${username}/collection/folders/${FOLDER_ID}/releases`;
  const url = `${urlBase}?page=${page}&per_page=${perPage}`;
  const res = await fetch(url, {
    headers: { Authorization: `Discogs token=${DISCOGS_USER_TOKEN}` },
  });
  console.log(res);

  if (!res.ok)
    throw new Error(`Error fetching collection page ${page}: ${res.status}`);
  return res.json();
}

export async function getReleaseDetails(
  releaseId: string
): Promise<DiscogsReleaseDetails> {
  const url = `https://api.discogs.com/releases/${releaseId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Discogs token=${DISCOGS_USER_TOKEN}` },
  });
  if (!res.ok)
    throw new Error(`Error fetching release ${releaseId}: ${res.status}`);
  return res.json();
}
