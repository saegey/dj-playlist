import { getMeiliClient } from "@/lib/meili";
import type { Album, Track } from "@/types/track";
import { albumRepository } from "@/services/albumRepository";

type AlbumSearchHit = Record<string, unknown>;

export class AlbumApiService {
  async searchAlbums(params: {
    q: string;
    limit: number;
    offset: number;
    friendId?: string | null;
    sort: string;
  }): Promise<{
    hits: AlbumSearchHit[];
    estimatedTotalHits: number;
    offset: number;
    limit: number;
    query: string;
    sort: string;
  }> {
    const meiliClient = getMeiliClient();
    const index = meiliClient.index("albums");

    const filters: string[] = [];
    if (params.friendId) filters.push(`friend_id = ${params.friendId}`);
    const filterString = filters.length > 0 ? filters.join(" AND ") : undefined;

    const searchResults = await index.search(params.q, {
      limit: params.limit,
      offset: params.offset,
      filter: filterString,
      sort: [params.sort],
    });

    const hits = Array.isArray(searchResults.hits)
      ? (searchResults.hits as AlbumSearchHit[])
      : [];

    const friendIds = Array.from(
      new Set(
        hits
          .map((h) => h.friend_id)
          .filter((id): id is number => typeof id === "number")
      )
    );
    const usernameByFriendId = await albumRepository.getFriendUsernamesByIds(friendIds);

    const enrichedHits = hits.map((hit) => {
      const friend_id = hit.friend_id;
      if (typeof friend_id !== "number") return hit;
      return {
        ...hit,
        username: usernameByFriendId.get(friend_id) || undefined,
      };
    });

    const albumRefs = enrichedHits
      .map((h) => ({ release_id: h.release_id, friend_id: h.friend_id }))
      .filter(
        (r): r is { release_id: string; friend_id: number } =>
          typeof r.release_id === "string" && typeof r.friend_id === "number"
      );
    const coverByAlbumKey = await albumRepository.getFirstAudioCoverByAlbumRefs(
      albumRefs
    );

    const finalHits = enrichedHits.map((hit) => {
      const release_id = hit.release_id;
      const friend_id = hit.friend_id;
      if (typeof release_id !== "string" || typeof friend_id !== "number") {
        return hit;
      }
      return {
        ...hit,
        audio_file_album_art_url:
          coverByAlbumKey.get(`${release_id}:${friend_id}`) || undefined,
      };
    });

    return {
      hits: finalHits,
      estimatedTotalHits: searchResults.estimatedTotalHits ?? 0,
      offset: searchResults.offset,
      limit: searchResults.limit,
      query: params.q,
      sort: params.sort,
    };
  }

  async getAlbumDetail(
    releaseId: string,
    friendId: number
  ): Promise<{ album: Album; tracks: Track[] } | null> {
    const album = await albumRepository.getAlbumByReleaseAndFriend(
      releaseId,
      friendId
    );
    if (!album) return null;

    const tracks = await albumRepository.getTracksByReleaseAndFriend(
      releaseId,
      friendId
    );
    return { album, tracks };
  }
}

export const albumApiService = new AlbumApiService();
