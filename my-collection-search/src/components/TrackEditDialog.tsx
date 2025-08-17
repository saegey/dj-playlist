"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Track } from "@/types/track";
import type { TrackEditFormProps } from "./TrackEditForm";

const TrackEditForm = dynamic(() => import("./TrackEditForm"), { ssr: false });

export interface TrackEditDialogProps {
  editTrack: Track | null;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  initialFocusRef: React.RefObject<HTMLButtonElement | null>;
  onSave: (data: TrackEditFormProps) => void | Promise<void>;
}

export default function TrackEditDialog({
  editTrack,
  dialogOpen,
  setDialogOpen,
  initialFocusRef,
  onSave,
}: TrackEditDialogProps) {
  const [loaded, setLoaded] = useState<TrackEditFormProps | null>(null);

  const prevOpenRef = useRef<boolean>(dialogOpen);

  useEffect(() => {
    const justOpened = dialogOpen && !prevOpenRef.current;
    prevOpenRef.current = dialogOpen;
    if (!justOpened) return;

    let aborted = false;
    setLoaded(null);
    // Only fetch when we have identifiers
    if (!editTrack?.track_id || !editTrack?.username) return;
    const load = async () => {
      try {
        const url = `/api/tracks/${encodeURIComponent(
          editTrack.track_id
        )}?username=${encodeURIComponent(editTrack.username!)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return; // fallback to provided editTrack
        const data = await res.json();
        if (aborted) return;
        // Map API row to TrackEditFormProps (ensure username present)
        const mapped: TrackEditFormProps = {
          track_id: data.track_id,
          title: data.title,
          artist: data.artist,
          album: data.album,
          local_tags: data.local_tags,
          notes: data.notes,
          bpm: data.bpm,
          key: data.key,
          danceability: data.danceability,
          apple_music_url: data.apple_music_url,
          spotify_url: data.spotify_url,
          youtube_url: data.youtube_url,
          soundcloud_url: data.soundcloud_url,
          star_rating: data.star_rating,
          duration_seconds: data.duration_seconds,
          username: data.username || editTrack.username!,
        };
        setLoaded(mapped);
      } catch {
        // Ignore and rely on fallback
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [dialogOpen, editTrack?.track_id, editTrack?.username]);

  if (!editTrack || !editTrack.username) return null;

  return (
    <TrackEditForm
      track={(loaded ? loaded : null)!}
      onSave={onSave}
      dialogOpen={dialogOpen}
      setDialogOpen={setDialogOpen}
      initialFocusRef={initialFocusRef}
    />
  );
}
