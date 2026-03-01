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

export interface DiscogsApiTrack {
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
  tracklist: DiscogsApiTrack[];
  extraartists?: DiscogsExtraArtist[];
  images?: DiscogsImage[];
  thumb?: string;
  estimated_weight?: number;
  blocked_from_sale?: boolean;
  is_offensive?: boolean;
}

export interface DiscogsLookupVideo {
  uri?: string;
  url?: string;
  title?: string;
  duration?: number | string;
  description?: string;
}

export interface DiscogsLookupRelease {
  id?: string | number;
  title?: string;
  artists?: { name: string }[];
  artists_sort?: string;
  year?: number | null;
  styles?: string[];
  genres?: string[];
  uri?: string | null;
  thumb?: string | null;
  videos?: DiscogsLookupVideo[];
  video?: DiscogsLookupVideo[];
  [key: string]: unknown;
}

export interface DiscogsLookupTrack {
  position: string;
  title: string;
  duration: string;
  artists?: { name: string }[];
}

export interface DiscogsLookupResult {
  releaseId?: string;
  filePath?: string;
  release?: DiscogsLookupRelease | null;
  matchedTrack?: DiscogsLookupTrack | null;
  [key: string]: unknown;
}

export interface DiscogsSimpleArtist {
  name: string;
}
