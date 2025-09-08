"use client";

import React from "react";
import { Button, FileUpload, SimpleGrid, Spinner } from "@chakra-ui/react";
import { SiApplemusic, SiChatbot, SiSpotify, SiYoutube } from "react-icons/si";
import { FiDownload } from "react-icons/fi";
import { HiUpload } from "react-icons/hi";

export interface TrackEditActionsProps {
  aiLoading: boolean;
  onFetchAI: () => void;

  appleLoading: boolean;
  onSearchApple: () => void;

  youtubeLoading: boolean;
  onSearchYouTube: () => void;

  spotifyLoading: boolean;
  onSearchSpotify: () => void;

  analyzeLoading: boolean;
  analyzeDisabled: boolean;
  onAnalyzeAudio: () => void;

  uploadLoading: boolean;
  onFileSelected: (file: File | null) => void;
}

export default function TrackEditActions(props: TrackEditActionsProps) {
  const {
    aiLoading,
    onFetchAI,
    appleLoading,
    onSearchApple,
    youtubeLoading,
    onSearchYouTube,
    spotifyLoading,
    onSearchSpotify,
    analyzeLoading,
    analyzeDisabled,
    onAnalyzeAudio,
    uploadLoading,
    onFileSelected,
  } = props;

  return (
    <SimpleGrid columns={[2, 3]} gap={2}>
      <Button
        variant="outline"
        size="sm"
        loading={aiLoading}
        disabled={aiLoading}
        onClick={onFetchAI}
      >
        <SiChatbot /> Fetch from AI
      </Button>

      <Button
        variant="outline"
        size="sm"
        loading={appleLoading}
        disabled={appleLoading}
        onClick={onSearchApple}
      >
        <SiApplemusic /> Search Apple Music
      </Button>

      <Button
        variant="outline"
        size="sm"
        loading={youtubeLoading}
        disabled={youtubeLoading}
        onClick={onSearchYouTube}
      >
        <SiYoutube /> Search YouTube
      </Button>

      <Button
        variant="outline"
        size="sm"
        loading={spotifyLoading}
        disabled={spotifyLoading}
        onClick={onSearchSpotify}
      >
        <SiSpotify /> Search Spotify
      </Button>

      <Button
        variant="outline"
        size="sm"
        loading={analyzeLoading}
        disabled={analyzeDisabled}
        onClick={onAnalyzeAudio}
      >
        <FiDownload /> Fetch Audio
      </Button>

      <FileUpload.Root
        disabled={uploadLoading}
        onFileChange={(files) => {
          const file = files.acceptedFiles?.[0] || null;
          onFileSelected(file);
        }}
      >
        <FileUpload.HiddenInput />
        <FileUpload.Trigger asChild>
          <Button variant="outline" size="sm" width={"100%"}>
            {uploadLoading ? (
              <>
                <Spinner /> Uploading...
              </>
            ) : (
              <>
                <HiUpload /> Upload Audio
              </>
            )}
          </Button>
        </FileUpload.Trigger>
      </FileUpload.Root>
    </SimpleGrid>
  );
}
