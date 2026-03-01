"use client";

import React from "react";
import { Button, Dialog, Text } from "@chakra-ui/react";
import type { YoutubeVideo } from "@/types/track";
import type { DiscogsLookupVideo } from "@/types/discogs";
import type { AppleMusicResult } from "@/types/track";
import type { TrackEditFormProps } from "@/components/track-edit/types";
import YouTubePickerDialog from "@/components/YouTubePickerDialog";
import AppleMusicPickerDialog from "@/components/AppleMusicPickerDialog";
import DiscogsVideosModal from "@/components/DiscogsVideosModal";

type TrackEditFormDialogsProps = {
  track: TrackEditFormProps;
  title: string;
  artist: string;
  album: string;
  youtubeOpen: boolean;
  youtubeLoading: boolean;
  youtubeResults: YoutubeVideo[];
  onYouTubeOpenChange: (open: boolean) => void;
  onYouTubeSelect: (video: YoutubeVideo) => void;
  onYouTubeSearch: (title: string, artist: string) => void;
  appleOpen: boolean;
  onAppleOpenChange: (open: boolean) => void;
  onAppleSelect: (song: AppleMusicResult) => void;
  discogsOpen: boolean;
  onDiscogsClose: () => void;
  discogsVideos: DiscogsLookupVideo[] | null;
  discogsLoading: boolean;
  onDiscogsVideoSelect: (url: string) => void;
  removeAudioOpen: boolean;
  onRemoveAudioOpenChange: (open: boolean) => void;
  onRemoveAudioCancel: () => void;
  onRemoveAudioConfirm: () => void;
  removeAudioLoading: boolean;
};

export default function TrackEditFormDialogs({
  track,
  title,
  artist,
  album,
  youtubeOpen,
  youtubeLoading,
  youtubeResults,
  onYouTubeOpenChange,
  onYouTubeSelect,
  onYouTubeSearch,
  appleOpen,
  onAppleOpenChange,
  onAppleSelect,
  discogsOpen,
  onDiscogsClose,
  discogsVideos,
  discogsLoading,
  onDiscogsVideoSelect,
  removeAudioOpen,
  onRemoveAudioOpenChange,
  onRemoveAudioCancel,
  onRemoveAudioConfirm,
  removeAudioLoading,
}: TrackEditFormDialogsProps) {
  return (
    <>
      <YouTubePickerDialog
        open={youtubeOpen}
        loading={youtubeLoading}
        results={youtubeResults}
        onOpenChange={onYouTubeOpenChange}
        onSelect={onYouTubeSelect}
        initialTitle={title}
        initialArtist={artist}
        onSearch={onYouTubeSearch}
      />

      <AppleMusicPickerDialog
        open={appleOpen}
        onOpenChange={onAppleOpenChange}
        track={track}
        onSelect={onAppleSelect}
      />

      <DiscogsVideosModal
        open={discogsOpen}
        onClose={onDiscogsClose}
        videos={discogsVideos}
        loading={discogsLoading}
        trackTitle={title}
        trackArtist={artist}
        trackAlbum={album}
        onVideoSelect={onDiscogsVideoSelect}
      />

      <Dialog.Root
        open={removeAudioOpen}
        onOpenChange={(d) => onRemoveAudioOpenChange(d.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Remove Audio</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Are you sure you want to remove the local audio file? This action
                cannot be undone.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={onRemoveAudioCancel}
                disabled={removeAudioLoading}
              >
                Cancel
              </Button>
              <Button
                colorPalette="red"
                onClick={onRemoveAudioConfirm}
                loading={removeAudioLoading}
                disabled={removeAudioLoading}
              >
                Remove
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
