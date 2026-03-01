import { describe, it, expect } from "vitest";
import { discogsReleaseToAlbum } from "../albumUpsertService";
import type { DiscogsRelease } from "@/types/track";

function makeRelease(overrides: Partial<DiscogsRelease> = {}): DiscogsRelease {
  return {
    id: 123,
    title: "Test Album",
    artists_sort: "Test Artist",
    artists: [{ name: "Test Artist" }],
    year: 1995,
    genres: ["Electronic"],
    styles: ["Deep House", "Tech House"],
    uri: "https://www.discogs.com/release/123",
    thumb: "https://img.discogs.com/thumb.jpg",
    tracklist: [
      { position: "A1", title: "Track One", duration: "5:30", artists: [], duration_seconds: 330 },
      { position: "A2", title: "Track Two", duration: "6:00", artists: [], duration_seconds: 360 },
    ],
    date_added: "2024-01-01T00:00:00Z",
    date_changed: "2024-01-02T00:00:00Z",
    labels: [{ name: "Warp Records", catno: "WARP001" }],
    country: "UK",
    formats: [{ name: "Vinyl" }] as unknown as string,
    ...overrides,
  };
}

describe("discogsReleaseToAlbum", () => {
  it("maps all standard fields correctly", () => {
    const result = discogsReleaseToAlbum(makeRelease(), 42);

    expect(result.release_id).toBe("123");
    expect(result.friend_id).toBe(42);
    expect(result.title).toBe("Test Album");
    expect(result.artist).toBe("Test Artist");
    expect(result.year).toBe("1995");
    expect(result.genres).toEqual(["Electronic"]);
    expect(result.styles).toEqual(["Deep House", "Tech House"]);
    expect(result.album_thumbnail).toBe("https://img.discogs.com/thumb.jpg");
    expect(result.discogs_url).toBe("https://www.discogs.com/release/123");
    expect(result.date_added).toBe("2024-01-01T00:00:00Z");
    expect(result.date_changed).toBe("2024-01-02T00:00:00Z");
    expect(result.track_count).toBe(2);
    expect(result.label).toBe("Warp Records");
    expect(result.catalog_number).toBe("WARP001");
    expect(result.country).toBe("UK");
    expect(result.format).toBe("Vinyl");
  });

  it("prefers artists_sort over artists[0].name", () => {
    const result = discogsReleaseToAlbum(
      makeRelease({ artists_sort: "Sorted Artist", artists: [{ name: "Other Artist" }] }),
      1
    );
    expect(result.artist).toBe("Sorted Artist");
  });

  it("falls back to artists[0].name when artists_sort is absent", () => {
    const result = discogsReleaseToAlbum(
      makeRelease({ artists_sort: undefined, artists: [{ name: "Fallback Artist" }] }),
      1
    );
    expect(result.artist).toBe("Fallback Artist");
  });

  it("uses 'Unknown Artist' when both artists_sort and artists are absent", () => {
    const result = discogsReleaseToAlbum(
      makeRelease({ artists_sort: undefined, artists: undefined }),
      1
    );
    expect(result.artist).toBe("Unknown Artist");
  });

  it("uses 'Unknown Artist' when artists array is empty", () => {
    const result = discogsReleaseToAlbum(
      makeRelease({ artists_sort: undefined, artists: [] }),
      1
    );
    expect(result.artist).toBe("Unknown Artist");
  });

  it("stringifies numeric release id", () => {
    const result = discogsReleaseToAlbum(makeRelease({ id: 456 }), 1);
    expect(result.release_id).toBe("456");
  });

  it("uses undefined label when labels array is absent", () => {
    const result = discogsReleaseToAlbum(makeRelease({ labels: undefined }), 1);
    expect(result.label).toBeUndefined();
    expect(result.catalog_number).toBeUndefined();
  });

  it("uses undefined label when labels array is empty", () => {
    const result = discogsReleaseToAlbum(makeRelease({ labels: [] }), 1);
    expect(result.label).toBeUndefined();
    expect(result.catalog_number).toBeUndefined();
  });

  it("uses 0 for track_count when tracklist is empty", () => {
    const result = discogsReleaseToAlbum(makeRelease({ tracklist: [] }), 1);
    expect(result.track_count).toBe(0);
  });

  it("sets undefined format when formats is not an array", () => {
    // DiscogsRelease.formats is typed as string in some code paths
    const result = discogsReleaseToAlbum(
      makeRelease({ formats: "Vinyl" as unknown as string }),
      1
    );
    expect(result.format).toBeUndefined();
  });

  it("sets undefined format when formats array is empty", () => {
    const result = discogsReleaseToAlbum(
      makeRelease({ formats: [] as unknown as string }),
      1
    );
    expect(result.format).toBeUndefined();
  });

  it("omits year when release has no year", () => {
    const result = discogsReleaseToAlbum(makeRelease({ year: undefined }), 1);
    expect(result.year).toBeUndefined();
  });

  it("uses empty arrays for absent genres and styles", () => {
    const result = discogsReleaseToAlbum(
      makeRelease({ genres: undefined, styles: undefined }),
      1
    );
    expect(result.genres).toEqual([]);
    expect(result.styles).toEqual([]);
  });
});
