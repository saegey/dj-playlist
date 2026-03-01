"use client";

import React, { useState } from "react";
import type { YoutubeVideo } from "@/types/track";
import { useAppleMusicPicker } from "@/hooks/useAppleMusicPicker";
import { buildTrackMetadataPrompt } from "@/lib/prompts";
import { useTrackMetadataMutation } from "@/hooks/useTrackMetadataMutation";
import { useYouTubeMusicSearchMutation } from "@/hooks/useYouTubeMusicSearchMutation";
import { toaster } from "@/components/ui/toaster";
import {
  extractDiscogsVideos,
  lookupDiscogsVideos,
} from "@/services/internalApi/discogs";
import { fetchAiPromptSettings } from "@/services/internalApi/settings";
import type { DiscogsLookupVideo } from "@/types/discogs";
import type {
  TrackForSearch,
  TrackEditFormState,
} from "@/components/track-edit/types";

type UseTrackEditSearchIntegrationsArgs = {
  track: TrackForSearch;
  form: TrackEditFormState;
  setForm: React.Dispatch<React.SetStateAction<TrackEditFormState>>;
};

export function useTrackEditSearchIntegrations({
  track,
  form,
  setForm,
}: UseTrackEditSearchIntegrationsArgs) {
  const [youtubeResults, setYoutubeResults] = useState<YoutubeVideo[]>([]);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  const [discogsVideos, setDiscogsVideos] = useState<DiscogsLookupVideo[] | null>(null);
  const [showDiscogsModal, setShowDiscogsModal] = useState(false);
  const [discogsLoading, setDiscogsLoading] = useState(false);

  const { mutateAsync: searchYouTubeMusic, isPending: youtubeLoading } =
    useYouTubeMusicSearchMutation();
  const { mutateAsync: fetchMetadata, isPending: aiLoading } =
    useTrackMetadataMutation();
  const [aiPrompt, setAiPrompt] = useState<string>("");

  const applePicker = useAppleMusicPicker({
    onSelect: (song) => {
      setForm((prev) => ({
        ...prev,
        apple_music_url: song.url,
        duration_seconds: song.duration
          ? Math.round(song.duration / 1000)
          : undefined,
      }));
    },
  });

  React.useEffect(() => {
    const friendId = form.friend_id;
    if (!friendId) return;
    const run = async () => {
      try {
        const data = await fetchAiPromptSettings({ friend_id: friendId });
        if (typeof data.prompt === "string") {
          setAiPrompt(data.prompt);
        }
      } catch (err) {
        console.error("Failed to load AI prompt settings", err);
      }
    };
    run();
  }, [form.friend_id]);

  const fetchFromChatGPT = async () => {
    try {
      const prompt = buildTrackMetadataPrompt(
        {
          title: form.title,
          artist: form.artist,
          album: form.album,
          year: track?.year,
          duration: track?.duration,
          duration_seconds:
            typeof form.duration_seconds === "number"
              ? form.duration_seconds
              : null,
          isrc: track?.isrc,
          release_id: track?.release_id,
          discogs_url: track?.discogs_url,
          apple_music_url: form.apple_music_url || null,
          youtube_url: form.youtube_url || null,
          soundcloud_url: form.soundcloud_url || null,
          spotify_url: track?.spotify_url,
        },
        aiPrompt
      );
      const data = await fetchMetadata({
        prompt,
        friend_id: form.friend_id,
      });
      setForm((prev) => ({
        ...prev,
        local_tags: (data.genre as string) || prev.local_tags,
        notes: (data.notes as string) || prev.notes,
      }));
    } catch {
      alert("Error fetching from AI");
    }
  };

  const searchYouTube = async (title?: string, artist?: string) => {
    setShowYoutubeModal(true);
    setYoutubeResults([]);

    const searchTitle = title || form.title;
    const searchArtist = artist || form.artist;

    if (
      !searchTitle ||
      !searchArtist ||
      searchTitle.trim() === "" ||
      searchArtist.trim() === ""
    ) {
      return;
    }

    try {
      const data = await searchYouTubeMusic({
        title: searchTitle,
        artist: searchArtist,
      });
      setYoutubeResults(data.results || []);
    } catch (err) {
      console.error("YouTube search error:", err);
      alert("YouTube search error");
    }
  };

  const handleYouTubeSearch = (title: string, artist: string) => {
    searchYouTube(title, artist);
  };

  const handleYoutubeSelect = (video: YoutubeVideo) => {
    setForm((prev) => ({ ...prev, youtube_url: video.url }));
    setShowYoutubeModal(false);
  };

  const searchDiscogs = async () => {
    if (!track?.track_id) {
      toaster.create({
        title: "Cannot search Discogs",
        description: "Track ID is missing",
        type: "error",
      });
      return;
    }

    setShowDiscogsModal(true);
    setDiscogsLoading(true);
    try {
      const result = await lookupDiscogsVideos(track.track_id);
      const videos = extractDiscogsVideos(result);
      setDiscogsVideos(videos);

      if (videos.length === 0) {
        toaster.create({
          title: "No videos found",
          description: "No Discogs videos found for this release",
          type: "warning",
        });
      }
    } catch (err) {
      console.error("Discogs search error:", err);
      toaster.create({
        title: "Discogs search error",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
      setDiscogsVideos([]);
    } finally {
      setDiscogsLoading(false);
    }
  };

  const handleDiscogsVideoSelect = (url: string) => {
    setForm((prev) => ({ ...prev, youtube_url: url }));
    setShowDiscogsModal(false);
    toaster.create({
      title: "YouTube URL Added",
      description: "Discogs video URL saved to YouTube field",
      type: "success",
    });
  };

  const searchAppleMusic = async () => {
    await applePicker.search({ title: form.title, artist: form.artist });
  };

  return {
    aiLoading,
    fetchFromChatGPT,
    aiPrompt,
    youtubeLoading,
    searchYouTube,
    youtubeResults,
    showYoutubeModal,
    setShowYoutubeModal,
    handleYouTubeSearch,
    handleYoutubeSelect,
    applePicker,
    searchAppleMusic,
    discogsVideos,
    showDiscogsModal,
    setShowDiscogsModal,
    discogsLoading,
    searchDiscogs,
    handleDiscogsVideoSelect,
  };
}
