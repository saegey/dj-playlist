"use client";

import React from "react";
import { Button, Menu, Icon, Box } from "@chakra-ui/react";
import { SiApplemusic, SiChatbot, SiYoutube, SiDiscogs } from "react-icons/si";
import { FiDownload, FiMoreVertical, FiTrash } from "react-icons/fi";
import { HiUpload } from "react-icons/hi";

export interface TrackEditActionsProps {
  aiLoading: boolean;
  onFetchAI: () => void;

  appleLoading: boolean;
  onSearchApple: () => void;

  youtubeLoading: boolean;
  onSearchYouTube: () => void;

  discogsLoading?: boolean;
  onSearchDiscogs?: () => void;

  analyzeLoading: boolean;
  analyzeDisabled: boolean;
  onAnalyzeAudio: () => void;

  uploadLoading: boolean;
  onFileSelected: (file: File | null) => void;

  hasAudio: boolean;
  onRemoveAudio: () => void;
  removeAudioLoading: boolean;
}

export default function TrackEditActions(props: TrackEditActionsProps) {
  const {
    aiLoading,
    onFetchAI,
    onSearchApple,
    youtubeLoading,
    onSearchYouTube,
    discogsLoading,
    onSearchDiscogs,
    analyzeLoading,
    analyzeDisabled,
    onAnalyzeAudio,
    uploadLoading,
    onFileSelected,
    hasAudio,
    onRemoveAudio,
    removeAudioLoading,
  } = props;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button size="sm" variant="outline" aria-label="Track actions">
            <FiMoreVertical />
            <Box ml={1}>Actions</Box>
          </Button>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            {/* Search & Fetch Section */}
            <Menu.Item
              value="ai"
              onSelect={onFetchAI}
              disabled={aiLoading}
            >
              <Icon as={SiChatbot} />
              {aiLoading ? "Fetching from AI..." : "Fetch from AI"}
            </Menu.Item>

            <Menu.Item value="apple" onSelect={onSearchApple}>
              <Icon as={SiApplemusic} /> Search Apple Music
            </Menu.Item>

            <Menu.Item
              value="youtube"
              onSelect={onSearchYouTube}
              disabled={youtubeLoading}
            >
              <Icon as={SiYoutube} />
              {youtubeLoading ? "Searching YouTube..." : "Search YouTube"}
            </Menu.Item>

            {onSearchDiscogs && (
              <Menu.Item
                value="discogs"
                onSelect={onSearchDiscogs}
                disabled={discogsLoading}
              >
                <Icon as={SiDiscogs} />
                {discogsLoading ? "Searching Discogs..." : "Search Discogs"}
              </Menu.Item>
            )}

            {/* Audio Section */}
            <Box
              as="hr"
              my={1}
              borderColor="gray.200"
              borderWidth={0}
              borderTopWidth={1}
            />

            {hasAudio ? (
              <Menu.Item
                value="remove-audio"
                onSelect={onRemoveAudio}
                disabled={removeAudioLoading}
                color="fg.error"
                _hover={{ bg: "bg.error", color: "fg.error" }}
              >
                <Icon as={FiTrash} />
                {removeAudioLoading ? "Removing..." : "Remove Audio"}
              </Menu.Item>
            ) : (
              <Menu.Item
                value="fetch-audio"
                onSelect={onAnalyzeAudio}
                disabled={analyzeDisabled || analyzeLoading}
              >
                <Icon as={FiDownload} />
                {analyzeLoading ? "Fetching Audio..." : "Fetch Audio"}
              </Menu.Item>
            )}

            <Menu.Item
              value="upload-audio"
              onSelect={handleUploadClick}
              disabled={uploadLoading}
            >
              <Icon as={HiUpload} />
              {uploadLoading ? "Uploading..." : "Upload Audio"}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          onFileSelected(file);
          // Reset input so same file can be selected again
          e.target.value = "";
        }}
        disabled={uploadLoading}
      />
    </>
  );
}
