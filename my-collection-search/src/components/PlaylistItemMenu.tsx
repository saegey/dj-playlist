"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Drawer,
  Flex,
  Link,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  FiArrowDown,
  FiArrowUp,
  FiDownload,
  FiEdit,
  FiMoreVertical,
  FiPlus,
  FiTrash,
} from "react-icons/fi";
import type { Track } from "@/types/track";
import { useAddToPlaylistDialog } from "@/hooks/useAddToPlaylistDialog";
import PlaylistRecommendations from "./PlaylistRecommendations";
import { analyzeTrackAsync } from "@/services/internalApi/tracks";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";

export interface PlaylistItemMenuProps {
  idx: number;
  total: number;
  track: Track;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  removeFromPlaylist: (indexToRemove: number) => void;
  size?: "xs" | "sm" | "md" | "lg";
}

const menuDivider = (
  <Box
    as="hr"
    my={1}
    borderColor="gray.200"
    _dark={{ borderColor: "gray.700" }}
    borderWidth={0}
    borderTopWidth={1}
  />
);

const drawerDivider = (
  <Box
    as="hr"
    borderColor="gray.200"
    _dark={{ borderColor: "gray.700" }}
    borderWidth={0}
    borderTopWidth={1}
  />
);

function DrawerItem({
  icon,
  label,
  onClick,
  href,
  disabled,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  color?: string;
}) {
  const inner = (
    <Flex
      align="center"
      gap={4}
      px={5}
      py={3.5}
      w="full"
      color={disabled ? "fg.subtle" : color}
      _hover={disabled ? undefined : { bg: "bg.subtle" }}
      opacity={disabled ? 0.4 : 1}
    >
      <Box flexShrink={0} fontSize="md">{icon}</Box>
      <Text fontSize="md">{label}</Text>
    </Flex>
  );

  if (href && !disabled) {
    return (
      <Link as={NextLink} href={href} display="block" _hover={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return (
    <Box
      as="button"
      onClick={disabled ? undefined : onClick}
      w="full"
      textAlign="left"
      cursor={disabled ? "not-allowed" : "pointer"}
    >
      {inner}
    </Box>
  );
}

export const PlaylistItemMenu: React.FC<PlaylistItemMenuProps> = ({
  idx,
  total,
  track,
  moveTrack,
  removeFromPlaylist,
  size = "xs",
}) => {
  const { openForTrack, playlistDialog } = useAddToPlaylistDialog();
  const isFirst = idx === 0;
  const isLast = idx === total - 1;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recommendationsModalOpen, setRecommendationsModalOpen] = useState(false);
  const [recommendationsTrackSnapshot, setRecommendationsTrackSnapshot] = useState<Track[]>([]);
  const [fetchAudioLoading, setFetchAudioLoading] = useState(false);

  const canFetchAudio =
    !track.local_audio_url &&
    Boolean(track.apple_music_url || track.youtube_url || track.soundcloud_url);

  const editHref = `/tracks/${encodeURIComponent(track.track_id)}/edit?friend_id=${track.friend_id}`;

  const close = () => setDrawerOpen(false);

  const handleFetchAudio = async () => {
    if (!track.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setFetchAudioLoading(true);
    try {
      const response = await analyzeTrackAsync({
        track_id: track.track_id,
        friend_id: track.friend_id,
        apple_music_url: track.apple_music_url,
        youtube_url: track.youtube_url,
        soundcloud_url: cleanSoundcloudUrl(track.soundcloud_url),
        title: track.title,
        artist: track.artist,
      });
      toaster.create({
        title: "Audio Fetch Queued",
        description: `Job ID: ${response.jobId}`,
        type: "success",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to queue audio fetch",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setFetchAudioLoading(false);
    }
  };

  return (
    <>
      {/* Mobile: bottom sheet */}
      <Box display={{ base: "block", md: "none" }}>
        <Button variant="plain" size={size} onClick={() => setDrawerOpen(true)}>
          <FiMoreVertical size={16} />
        </Button>
        <Drawer.Root placement="bottom" open={drawerOpen} onOpenChange={(d) => setDrawerOpen(d.open)}>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content borderTopRadius="xl" maxH="85vh">
                <Drawer.Header borderBottomWidth="1px" py={3} px={5} position="relative">
                  <Box pr={8}>
                    <Text fontSize="xs" color="fg.muted">{track.artist}</Text>
                    <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>{track.title}</Text>
                  </Box>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton size="sm" position="absolute" right={3} top="50%" transform="translateY(-50%)" />
                  </Drawer.CloseTrigger>
                </Drawer.Header>
                <Drawer.Body p={0} overflowY="auto">
                  <Stack gap={0}>
                    <DrawerItem icon={<FiArrowUp />} label="Move Up" disabled={isFirst} onClick={() => { moveTrack(idx, idx - 1); close(); }} />
                    <DrawerItem icon={<FiArrowDown />} label="Move Down" disabled={isLast} onClick={() => { moveTrack(idx, idx + 1); close(); }} />
                    {drawerDivider}
                    <DrawerItem icon={<FiEdit />} label="Edit" href={editHref} />
                    <DrawerItem icon={<FiPlus />} label="Add to Playlist" onClick={() => { openForTrack(track); close(); }} />
                    {canFetchAudio && (
                      <DrawerItem
                        icon={<FiDownload />}
                        label={fetchAudioLoading ? "Fetching Audio..." : "Fetch Audio"}
                        disabled={fetchAudioLoading}
                        onClick={() => { handleFetchAudio(); close(); }}
                      />
                    )}
                    <DrawerItem
                      icon={<FiPlus />}
                      label="AI Recommendations"
                      onClick={() => { setRecommendationsTrackSnapshot([track]); setRecommendationsModalOpen(true); close(); }}
                    />
                    {drawerDivider}
                    <DrawerItem
                      icon={<FiTrash />}
                      label="Remove"
                      color="red.500"
                      onClick={() => { removeFromPlaylist(idx); close(); }}
                    />
                  </Stack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </Box>

      {/* Desktop: dropdown menu */}
      <Box display={{ base: "none", md: "block" }}>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button variant="plain" size={size}>
              <FiMoreVertical size={16} />
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item onSelect={() => moveTrack(idx, idx - 1)} value="up" disabled={isFirst}>
                <FiArrowUp /> Move Up
              </Menu.Item>
              <Menu.Item onSelect={() => moveTrack(idx, idx + 1)} value="down" disabled={isLast}>
                <FiArrowDown /> Move Down
              </Menu.Item>
              <Menu.Item value="edit" asChild>
                <NextLink href={editHref}>
                  <FiEdit /> Edit
                </NextLink>
              </Menu.Item>
              <Menu.Item onSelect={() => openForTrack(track)} value="add">
                <FiPlus /> Add to Playlist
              </Menu.Item>
              {canFetchAudio && (
                <Menu.Item onSelect={handleFetchAudio} value="fetch-audio" disabled={fetchAudioLoading}>
                  <FiDownload /> {fetchAudioLoading ? "Fetching Audio..." : "Fetch Audio"}
                </Menu.Item>
              )}
              <Menu.Item
                onSelect={() => { setRecommendationsTrackSnapshot([track]); setRecommendationsModalOpen(true); }}
                value="recommendations"
              >
                <FiPlus /> AI Recommendations
              </Menu.Item>
              {menuDivider}
              <Menu.Item
                onSelect={() => removeFromPlaylist(idx)}
                value="delete"
                color="fg.error"
                _hover={{ bg: "bg.error", color: "fg.error" }}
              >
                <FiTrash /> Remove
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Box>

      {playlistDialog}

      <Dialog.Root
        open={recommendationsModalOpen}
        onOpenChange={(e) => setRecommendationsModalOpen(e.open)}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Flex justify="space-between" align="center" width="100%">
                  <Dialog.Title>AI Recommendations for {track.title}</Dialog.Title>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRecommendationsTrackSnapshot([track])}
                    mr={8}
                  >
                    Refresh
                  </Button>
                </Flex>
              </Dialog.Header>
              <Dialog.Body maxH="70vh" overflowY="auto">
                {recommendationsModalOpen && (
                  <PlaylistRecommendations
                    playlist={recommendationsTrackSnapshot}
                    limit={50}
                    onAddToPlaylist={(t) => openForTrack(t)}
                  />
                )}
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default PlaylistItemMenu;
