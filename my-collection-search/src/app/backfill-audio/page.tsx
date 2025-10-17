"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spinner, Text, Container } from "@chakra-ui/react";

import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useMeili } from "@/providers/MeiliProvider";
import BackfillFilters from "@/components/backfill/BackfillFilters";
import { useUsername } from "@/providers/UsernameProvider";
import BackfillActionBar from "@/components/backfill/BackfillActionBar";
import BackfillTable from "@/components/backfill/BackfillTable";
import BackfillPagination from "@/components/backfill/BackfillPagination";
import type { BackfillTrack } from "@/components/backfill/types";
import { useSearchResults } from "@/hooks/useSearchResults";
import { useBackfillStatusMutation } from "@/hooks/useBackfillStatusMutation";
import { useVectorizeTrackMutation } from "@/hooks/useVectorizeTrackMutation";
import { useAsyncAnalyzeTrackMutation } from "@/hooks/useAsyncAnalyzeTrackMutation";

// BackfillTrack moved to components/backfill/types

export default function BackfillAudioPage() {
  const [showMissingAudio, setShowMissingAudio] = useState(true);
  const [showMissingVectors, setShowMissingVectors] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { friends: usernames, friendsLoading: usernamesLoading } =
    useFriendsQuery({ showCurrentUser: true, showSpotifyUsernames: true });
  const { friend: selectedFriend } = useUsername();
  const [analyzing, setAnalyzing] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const { client: meiliClient, ready } = useMeili();
  const { mutate: updateStatus } = useBackfillStatusMutation();
  const { mutateAsync: vectorize } = useVectorizeTrackMutation();
  const { mutateAsync: analyze } = useAsyncAnalyzeTrackMutation();

  // Build Meili filter (AND conditions)
  const filter = useMemo(() => {
    const f: string[] = [];
    if (selectedFriend) f.push(`friend_id = ${selectedFriend.id}`);
    if (showMissingAudio) {
      f.push(
        "local_audio_url IS NULL AND (apple_music_url IS NOT NULL OR youtube_url IS NOT NULL OR soundcloud_url IS NOT NULL)"
      );
    } else {
      f.push("local_audio_url IS NOT NULL");
    }
    if (showMissingVectors) {
      f.push("hasVectors = false");
    } else {
      f.push("hasVectors = true");
    }
    return f;
  }, [selectedFriend, showMissingAudio, showMissingVectors]);

  // Use shared search hook in paginated mode with page size 1
  const {
    results: tracks,
    estimatedResults,
    loading,
    query,
    setQuery,
  } = useSearchResults({
    client: ready ? meiliClient : null,
    mode: "page",
    limit: pageSize,
    page,
    filter,
  });

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [selectedFriend, query, showMissingAudio, showMissingVectors]);

  // Derive page tracks with UI-only status fields (mutated optimistically)
  const pageTracks = (tracks as BackfillTrack[]) || [];

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
  const selectAll = () =>
    setSelected(new Set(pageTracks.map((t) => t.track_id)));
  const deselectAll = () => setSelected(new Set());


  const handleVectorizeSelected = async () => {
    setAnalyzing(true);
    for (const trackId of selected) {
      updateStatus({ track_id: trackId, status: "analyzing", errorMsg: null });
      try {
        const track = pageTracks.find((t) => t.track_id === trackId);
        if (!track?.friend_id) {
          throw new Error(`Track ${trackId} is missing friend_id`);
        }
        await vectorize({
          track_id: trackId,
          friend_id: track.friend_id,
        });
        updateStatus({ track_id: trackId, status: "success", errorMsg: null });
      } catch (err) {
        updateStatus({
          track_id: trackId,
          status: "error",
          errorMsg:
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : "Unknown error",
        });
      }
    }
    setAnalyzing(false);
  };

  const handleAnalyzeSelected = async () => {
    setAnalyzing(true);

    // Queue all selected tracks for async processing
    for (const trackId of selected) {
      updateStatus({
        track_id: trackId,
        status: "analyzing",
        errorMsg: null,
      });
      try {
        const track = pageTracks.find((t) => t.track_id === trackId);
        if (!track) {
          throw new Error(`Track ${trackId} not found in page data`);
        }
        if (!track.friend_id) {
          throw new Error(`Track ${trackId} is missing friend_id`);
        }

        // Queue the track for async processing using gamdl worker
        const response = await analyze({
          track_id: trackId,
          friend_id: track.friend_id,
          apple_music_url: track.apple_music_url,
          youtube_url: track.youtube_url,
          soundcloud_url: track.soundcloud_url,
          spotify_url: track.spotify_url,
        });

        console.log(`Queued track ${trackId} for processing, job ID: ${response.jobId}`);
        updateStatus({
          track_id: trackId,
          status: "success",
          errorMsg: null,
        });
      } catch (err) {
        updateStatus({
          track_id: trackId,
          status: "error",
          errorMsg:
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : "Unknown error",
        });
      }
    }
    setAnalyzing(false);
  };

  return (
    <>
      <Container>
        {/* Job Queue Link */}

        <BackfillFilters
          friends={usernames}
          usernamesLoading={usernamesLoading}
          artistSearch={query}
          setArtistSearch={setQuery}
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
        ) : pageTracks.length === 0 ? (
          <Text color="gray.500">No tracks to backfill.</Text>
        ) : (
          <BackfillTable
            tracks={pageTracks}
            selected={selected}
            analyzing={analyzing}
            onToggleOne={toggleSelect}
            onToggleAll={() => {
              if (selected.size === pageTracks.length) {
                deselectAll();
              } else {
                selectAll();
              }
            }}
          />
        )}
        <BackfillPagination
          total={estimatedResults}
          pageSize={pageSize}
          page={page}
          setPage={setPage}
        />
      </Container>
    </>
  );
}
