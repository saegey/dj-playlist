// --- Discogs API Types ---
export interface DiscogsArtist {
  name: string;
  anv: string;
  join: string;
  role: string;
  tracks: string;
  id: number;
  resource_url: string;
  thumbnail_url?: string;
}

export interface DiscogsLabel {
  name: string;
  catno: string;
  entity_type: string;
  entity_type_name: string;
  id: number;
  resource_url: string;
  thumbnail_url?: string;
}

export interface DiscogsCompany {
  name: string;
  catno: string;
  entity_type: string;
  entity_type_name: string;
  id: number;
  resource_url: string;
  thumbnail_url?: string;
}

export interface DiscogsFormat {
  name: string;
  qty: string;
  descriptions: string[];
}

export interface DiscogsCommunity {
  have: number;
  want: number;
  rating: {
    count: number;
    average: number;
  };
  submitter: {
    username: string;
    resource_url: string;
  };
  contributors: Array<{
    username: string;
    resource_url: string;
  }>;
  data_quality: string;
  status: string;
}

export interface DiscogsIdentifier {
  type: string;
  value: string;
  description?: string;
}

export interface DiscogsTrack {
  position: string;
  type_: string;
  title: string;
  duration: string;
}

export interface DiscogsVideo {
  uri: string;
  title: string;
  description?: string;
  duration: number;
  embed: boolean;
}

export interface DiscogsExtraArtist {
  name: string;
  anv: string;
  join: string;
  role: string;
  tracks: string;
  id: number;
  resource_url: string;
}

export interface DiscogsImage {
  type: string;
  uri: string;
  resource_url: string;
  uri150: string;
  width: number;
  height: number;
}

export interface DiscogsReleaseDetails {
  id: number;
  status: string;
  year: number;
  resource_url: string;
  uri: string;
  artists: DiscogsArtist[];
  artists_sort: string;
  labels: DiscogsLabel[];
//   series: any[];
  companies: DiscogsCompany[];
  formats: DiscogsFormat[];
  data_quality: string;
  community: DiscogsCommunity;
  format_quantity: number;
  date_added: string;
  date_changed: string;
  num_for_sale: number;
  lowest_price?: number;
  master_id?: number;
  master_url?: string;
  title: string;
  country: string;
  released: string;
  notes?: string;
  released_formatted: string;
  identifiers: DiscogsIdentifier[];
  videos: DiscogsVideo[];
  genres: string[];
  styles: string[];
  tracklist: DiscogsTrack[];
  extraartists?: DiscogsExtraArtist[];
  images?: DiscogsImage[];
  thumb?: string;
  estimated_weight?: number;
  blocked_from_sale?: boolean;
  is_offensive?: boolean;
}

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
