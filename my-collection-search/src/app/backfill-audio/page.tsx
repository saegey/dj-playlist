"use client";

import React, { useEffect, useState } from "react";
import { Spinner, Text, Container } from "@chakra-ui/react";

import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useMeili } from "@/providers/MeiliProvider";
import BackfillFilters from "@/components/backfill/BackfillFilters";
import { useUsername } from "@/providers/UsernameProvider";
import { useTracksQuery } from "@/hooks/useTracksQuery";
import BackfillActionBar from "@/components/backfill/BackfillActionBar";
import BackfillTable from "@/components/backfill/BackfillTable";
import BackfillPagination from "@/components/backfill/BackfillPagination";
import type { BackfillTrack } from "@/components/backfill/types";

// BackfillTrack moved to components/backfill/types

export default function BackfillAudioPage() {
  const [tracks, setTracks] = useState<BackfillTrack[]>([]);
  const [showMissingAudio, setShowMissingAudio] = useState(true);
  const [showMissingVectors, setShowMissingVectors] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { friends: usernames, friendsLoading: usernamesLoading } =
    useFriendsQuery({ showCurrentUser: true, showSpotifyUsernames: true });
  const { username: selectedUsername } = useUsername();
  const [artistSearch, setArtistSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const { client: meiliClient, ready } = useMeili();
  const { saveTrack } = useTracksQuery();

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [selectedUsername, artistSearch, showMissingAudio, showMissingVectors]);

  useEffect(() => {
    setLoading(true);
    const fetchTracks = async () => {
      if (!ready || !meiliClient) return;
      const index = meiliClient.index("tracks");
      const filter = [];
      if (selectedUsername) filter.push(`username = '${selectedUsername}'`);
      if (showMissingAudio) {
        filter.push(
          "local_audio_url IS NULL AND (apple_music_url IS NOT NULL OR youtube_url IS NOT NULL OR soundcloud_url IS NOT NULL)"
        );
      } else {
        filter.push("local_audio_url IS NOT NULL");
      }
      if (showMissingVectors) {
        filter.push("hasVectors = false");
      } else {
        filter.push("hasVectors = true");
      }
      const offset = (page - 1) * pageSize;
      const results = await index.search("", {
        q: artistSearch.trim(),
        filter: filter.join(" AND "),
        limit: pageSize,
        offset,
      });
      setTracks((results.hits as BackfillTrack[]) || []);
      setTotal(results.estimatedTotalHits || 0);
      setSelected(new Set());
      setLoading(false);
    };
    fetchTracks();
  }, [
    selectedUsername,
    artistSearch,
    showMissingAudio,
    showMissingVectors,
    page,
    meiliClient,
    ready,
  ]);

  const toggleSelect = (trackId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(tracks.map((t) => t.track_id)));
  const deselectAll = () => setSelected(new Set());

  const handleVectorizeSelected = async () => {
    setAnalyzing(true);
    const updated = [...tracks];
    for (const trackId of selected) {
      const idx = updated.findIndex((t) => t.track_id === trackId);
      if (idx === -1) continue;
      updated[idx].status = "analyzing";
      setTracks([...updated]);
      try {
        const res = await fetch("/api/tracks/vectorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track_id: updated[idx].track_id,
            username: updated[idx].username ?? "",
            // add other fields if needed
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        updated[idx].status = "success";
      } catch (err) {
        updated[idx].status = "error";
        updated[idx].errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "Unknown error";
      }
      setTracks([...updated]);
    }
    setAnalyzing(false);
  };

  const handleAnalyzeSelected = async () => {
    setAnalyzing(true);

    const updated = [...tracks];
    for (const trackId of selected) {
      const idx = updated.findIndex((t) => t.track_id === trackId);
      if (idx === -1) continue;
      updated[idx].status = "analyzing";
      setTracks([...updated]);
      try {
        const res = await fetch("/api/tracks/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track_id: updated[idx].track_id,
            apple_music_url: updated[idx].apple_music_url,
            youtube_url: updated[idx].youtube_url,
            soundcloud_url: updated[idx].soundcloud_url,
            spotify_url: updated[idx].spotify_url,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        const data = await res.json();

        saveTrack({
          username: updated[idx].username ?? "",
          track_id: updated[idx].track_id,
          bpm:
            data.rhythm && typeof data.rhythm.bpm === "number"
              ? Number(Math.round(data.rhythm.bpm))
              : undefined,
          key: data.tonal
            ? `${data.tonal.key_edma.key} ${data.tonal.key_edma.scale}`
            : undefined,
          danceability:
            data.rhythm && typeof data.rhythm.danceability === "number"
              ? data.rhythm.danceability.toFixed(3)
              : undefined,
          duration_seconds: Math.round(data.metadata.audio_properties.length),
          // mood_happy: data.mood_happy,
          // mood_sad: data.mood_sad,
          // mood_relaxed: data.mood_relaxed,
          // mood_aggressive: data.mood_aggressive,
        });
        updated[idx].status = "success";
      } catch (err) {
        updated[idx].status = "error";
        updated[idx].errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "Unknown error";
      }
      setTracks([...updated]);
    }
    setAnalyzing(false);
  };

  return (
    <>
      <Container>
        {/* Pagination UI */}

        <BackfillFilters
          usernames={usernames}
          usernamesLoading={usernamesLoading}
          artistSearch={artistSearch}
          setArtistSearch={setArtistSearch}
          showMissingAudio={showMissingAudio}
          setShowMissingAudio={setShowMissingAudio}
          showMissingVectors={showMissingVectors}
          setShowMissingVectors={setShowMissingVectors}
          analyzing={analyzing}
        />

        {/* ActionBar appears when items are selected */}
        <BackfillActionBar
          selectedCount={selected.size}
          analyzing={analyzing}
          onVectorize={handleVectorizeSelected}
          onAnalyze={handleAnalyzeSelected}
          onClose={deselectAll}
        />

        {loading ? (
          <Spinner />
        ) : tracks.length === 0 ? (
          <Text color="gray.500">No tracks to backfill.</Text>
        ) : (
          <BackfillTable
            tracks={tracks}
            selected={selected}
            analyzing={analyzing}
            onToggleOne={toggleSelect}
            onToggleAll={() => {
              if (selected.size === tracks.length) {
                deselectAll();
              } else {
                selectAll();
              }
            }}
          />
        )}
        <BackfillPagination
          total={total}
          pageSize={pageSize}
          page={page}
          setPage={setPage}
        />
      </Container>
    </>
  );
}
