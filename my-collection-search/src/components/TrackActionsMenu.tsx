"use client";

import React, { useState } from "react";
import {
  Button,
  Menu,
  Portal,
  Dialog,
  Drawer,
  Box,
  Flex,
  Icon,
  Link,
  Text,
  Stack,
  CloseButton,
} from "@chakra-ui/react";
import {
  FiCode,
  FiDownload,
  FiEdit,
  FiMoreVertical,
  FiPlay,
  FiPlus,
  FiPlusSquare,
  FiTrash2,
} from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import { SiApplemusic, SiYoutube, SiSoundcloud } from "react-icons/si";
import NextLink from "next/link";

import type { Track } from "@/types/track";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { useAddToPlaylistDialog } from "@/hooks/useAddToPlaylistDialog";
import { analyzeTrackAsync, softDeleteTrack } from "@/services/internalApi/tracks";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";
import posthog from "posthog-js";

type Props = {
  track: Track;
  onOpenTrackDebug?: () => void;
};

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
  external,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  color?: string;
}) {
  const inner = (
    <Flex align="center" gap={4} px={5} py={3.5} w="full" color={color} _hover={{ bg: "bg.subtle" }}>
      <Box flexShrink={0} fontSize="md">{icon}</Box>
      <Text fontSize="md">{label}</Text>
    </Flex>
  );

  if (href && external) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" display="block" _hover={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <Link as={NextLink} href={href} display="block" _hover={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return (
    <Box as="button" onClick={onClick} w="full" textAlign="left" cursor="pointer">
      {inner}
    </Box>
  );
}

export default function TrackActionsMenu({ track, onOpenTrackDebug }: Props) {
  const { appendToQueue, replacePlaylist } = usePlaylistPlayer();
  const editHref = `/tracks/${encodeURIComponent(track.track_id)}/edit?friend_id=${track.friend_id}`;
  const { openForTrack, playlistDialog, nameDialog } = useAddToPlaylistDialog();
  const queryClient = useQueryClient();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fetchAudioLoading, setFetchAudioLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canFetchAudio =
    !track.local_audio_url &&
    Boolean(track.apple_music_url || track.youtube_url || track.soundcloud_url);

  const hasStreamingLinks =
    track.apple_music_url || track.youtube_url || track.soundcloud_url;

  const handleDeleteConfirm = async () => {
    if (!track.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setDeleteLoading(true);
    try {
      await softDeleteTrack({ track_id: track.track_id, friend_id: track.friend_id });
      setDeleteConfirmOpen(false);
      toaster.create({ title: "Track deleted", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    } catch (err) {
      toaster.create({
        title: "Failed to delete track",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

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
      posthog.capture("audio_fetch_queued", {
        track_id: track.track_id,
        has_apple_music: !!track.apple_music_url,
        has_youtube: !!track.youtube_url,
        has_soundcloud: !!track.soundcloud_url,
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
        <Button
          variant="outline"
          size="sm"
          px={2}
          onClick={() => setDrawerOpen(true)}
          aria-label="Track actions"
        >
          <FiMoreVertical />
        </Button>
        <Drawer.Root placement="bottom" open={drawerOpen} onOpenChange={(d) => setDrawerOpen(d.open)}>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content borderTopRadius="xl" maxH="80vh">
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
                    {track.local_audio_url && (
                      <DrawerItem
                        icon={<FiPlay />}
                        label="Play"
                        onClick={() => { replacePlaylist([track], { autoplay: true, startIndex: 0 }); setDrawerOpen(false); }}
                      />
                    )}
                    <DrawerItem
                      icon={<FiPlus />}
                      label="Add to Playlist"
                      onClick={() => { openForTrack(track); setDrawerOpen(false); }}
                    />
                    <DrawerItem icon={<FiEdit />} label="Edit Track" href={editHref} />
                    {onOpenTrackDebug && (
                      <DrawerItem
                        icon={<FiCode />}
                        label="Track Debug"
                        onClick={() => {
                          onOpenTrackDebug();
                          setDrawerOpen(false);
                        }}
                      />
                    )}
                    <DrawerItem
                      icon={<FiPlusSquare />}
                      label="Add to Queue"
                      onClick={() => { appendToQueue(track); setDrawerOpen(false); }}
                    />
                    {canFetchAudio && (
                      <DrawerItem
                        icon={<FiDownload />}
                        label={fetchAudioLoading ? "Fetching Audio..." : "Fetch Audio"}
                        onClick={handleFetchAudio}
                      />
                    )}
                    {drawerDivider}
                    <DrawerItem
                      icon={<FiTrash2 />}
                      label="Delete Track"
                      color="red.500"
                      onClick={() => { setDeleteConfirmOpen(true); setDrawerOpen(false); }}
                    />
                    {hasStreamingLinks && (
                      <>
                        {drawerDivider}
                        {track.apple_music_url && (
                          <DrawerItem icon={<Icon as={SiApplemusic} />} label="Apple Music" href={track.apple_music_url} external />
                        )}
                        {track.youtube_url && (
                          <DrawerItem icon={<Icon as={SiYoutube} />} label="YouTube" href={track.youtube_url} external />
                        )}
                        {track.soundcloud_url && (
                          <DrawerItem icon={<Icon as={SiSoundcloud} />} label="SoundCloud" href={track.soundcloud_url} external />
                        )}
                      </>
                    )}
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
            <Button variant="outline" size="sm" px={2} aria-label="Track actions">
              <FiMoreVertical />
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              {track.local_audio_url && (
                <Menu.Item onSelect={() => replacePlaylist([track], { autoplay: true, startIndex: 0 })} value="play">
                  <FiPlay /> Play
                </Menu.Item>
              )}
              <Menu.Item onSelect={() => openForTrack(track)} value="add">
                <FiPlus /> Add to Playlist
              </Menu.Item>
              <Menu.Item value="edit" asChild>
                <NextLink href={editHref}>
                  <FiEdit /> Edit Track
                </NextLink>
              </Menu.Item>
              {onOpenTrackDebug && (
                <Menu.Item onSelect={onOpenTrackDebug} value="track-debug">
                  <FiCode /> Track Debug
                </Menu.Item>
              )}
              <Menu.Item onSelect={() => appendToQueue(track)} value="queue">
                <FiPlusSquare /> Add to Queue
              </Menu.Item>
              {canFetchAudio && (
                <Menu.Item onSelect={handleFetchAudio} value="fetch-audio" disabled={fetchAudioLoading}>
                  <FiDownload />
                  {fetchAudioLoading ? "Fetching Audio..." : "Fetch Audio"}
                </Menu.Item>
              )}
              {menuDivider}
              <Menu.Item onSelect={() => setDeleteConfirmOpen(true)} value="delete" color="red.500">
                <FiTrash2 /> Delete Track
              </Menu.Item>
              {hasStreamingLinks && (
                <>
                  {menuDivider}
                  {track.apple_music_url && (
                    <Menu.Item value="apple" asChild>
                      <Link href={track.apple_music_url} target="_blank" rel="noopener noreferrer">
                        <Icon as={SiApplemusic} /> Apple Music
                      </Link>
                    </Menu.Item>
                  )}
                  {track.youtube_url && (
                    <Menu.Item value="youtube" asChild>
                      <Link href={track.youtube_url} target="_blank" rel="noopener noreferrer">
                        <Icon as={SiYoutube} /> YouTube
                      </Link>
                    </Menu.Item>
                  )}
                  {track.soundcloud_url && (
                    <Menu.Item value="soundcloud" asChild>
                      <Link href={track.soundcloud_url} target="_blank" rel="noopener noreferrer">
                        <Icon as={SiSoundcloud} /> SoundCloud
                      </Link>
                    </Menu.Item>
                  )}
                </>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Box>

      {playlistDialog}
      {nameDialog}

      <Dialog.Root
        open={deleteConfirmOpen}
        onOpenChange={(e) => !deleteLoading && setDeleteConfirmOpen(e.open)}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete track?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <strong>{track.title}</strong> by {track.artist} will be soft-deleted and won&apos;t be re-imported from Discogs.
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>
                  Cancel
                </Button>
                <Button colorPalette="red" onClick={handleDeleteConfirm} loading={deleteLoading}>
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
