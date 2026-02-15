"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button, Heading, Stack, Flex, Spinner, Text } from "@chakra-ui/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import { useUpdateAlbumWithTracksMutation } from "@/hooks/useUpdateAlbumWithTracksMutation";
import { useAlbumDetailQuery } from "@/hooks/useAlbumsQuery";
import { useUsername } from "@/providers/UsernameProvider";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import AlbumForm, { AlbumFormData } from "@/components/AlbumForm";
import CoverArtUpload from "@/components/CoverArtUpload";
import TrackListBuilder, { TrackFormData } from "@/components/TrackListBuilder";
import PageContainer from "@/components/layout/PageContainer";

function EditAlbumContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const updateMutation = useUpdateAlbumWithTracksMutation();
  const { friend: currentUserFriend } = useUsername();
  const { playlistLength } = usePlaylistPlayer();

  const releaseId = params.releaseId as string;
  const friendId = parseInt(searchParams.get("friend_id") || "0");

  const { data, isLoading, error } = useAlbumDetailQuery(releaseId, friendId);

  const [albumForm, setAlbumForm] = useState<AlbumFormData>({
    title: '',
    artist: '',
    year: '',
    genres: [],
    styles: [],
    album_notes: '',
    album_rating: 0,
    purchase_price: '',
    condition: '',
    label: '',
    catalog_number: '',
    country: '',
    format: '',
    library_identifier: '',
  });

  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [tracks, setTracks] = useState<TrackFormData[]>([]);

  // Hydrate form when data loads
  useEffect(() => {
    if (data?.album && data?.tracks) {
      const { album, tracks: albumTracks } = data;

      // Hydrate album form
      setAlbumForm({
        title: album.title || '',
        artist: album.artist || '',
        year: album.year || '',
        genres: album.genres || [],
        styles: album.styles || [],
        album_notes: album.album_notes || '',
        album_rating: album.album_rating || 0,
        purchase_price: album.purchase_price?.toString() || '',
        condition: album.condition || '',
        label: album.label || '',
        catalog_number: album.catalog_number || '',
        country: album.country || '',
        format: album.format || '',
        library_identifier: album.library_identifier || '',
      });

      // Hydrate tracks
      setTracks(
        albumTracks.map((track) => ({
          track_id: track.track_id,
          title: track.title || '',
          artist: track.artist || '',
          position: track.position != null ? String(track.position) : '',
          duration_seconds: track.duration_seconds || undefined,
          bpm:
            track.bpm != null && track.bpm !== ""
              ? Number(track.bpm)
              : undefined,
          key: track.key || undefined,
          notes: track.notes || '',
          local_tags: track.local_tags || '',
          star_rating: track.star_rating || 0,
          apple_music_url: track.apple_music_url || '',
          spotify_url: track.spotify_url || '',
          youtube_url: track.youtube_url || '',
          soundcloud_url: track.soundcloud_url || '',
        }))
      );
    }
  }, [data]);

  // Update track artists when album artist changes
  useEffect(() => {
    if (albumForm.artist) {
      setTracks((prev) =>
        prev.map((track) => ({
          ...track,
          artist: track.artist || albumForm.artist,
        }))
      );
    }
  }, [albumForm.artist]);

  const handleSave = async () => {
    // Validate required fields
    if (!albumForm.title.trim()) {
      toaster.create({
        title: 'Album title required',
        description: 'Please enter an album title',
        type: 'error',
      });
      return;
    }

    if (!albumForm.artist.trim()) {
      toaster.create({
        title: 'Artist required',
        description: 'Please enter an artist name',
        type: 'error',
      });
      return;
    }

    // Validate at least one track
    if (tracks.length === 0) {
      toaster.create({
        title: 'No tracks',
        description: 'Please add at least one track',
        type: 'error',
      });
      return;
    }

    // Validate all tracks have title and artist
    for (let i = 0; i < tracks.length; i++) {
      if (!tracks[i].title.trim()) {
        toaster.create({
          title: `Track ${i + 1} missing title`,
          description: 'All tracks must have a title',
          type: 'error',
        });
        return;
      }
      if (!tracks[i].artist.trim()) {
        toaster.create({
          title: `Track ${i + 1} missing artist`,
          description: 'All tracks must have an artist',
          type: 'error',
        });
        return;
      }
    }

    // Check if we have a current user
    if (!currentUserFriend) {
      toaster.create({
        title: 'No library selected',
        description: 'Please select a library from the friend selector',
        type: 'error',
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        release_id: releaseId,
        album: {
          title: albumForm.title,
          artist: albumForm.artist,
          year: albumForm.year || undefined,
          genres: albumForm.genres.length > 0 ? albumForm.genres : undefined,
          styles: albumForm.styles.length > 0 ? albumForm.styles : undefined,
          album_notes: albumForm.album_notes || undefined,
          album_rating: albumForm.album_rating || undefined,
          purchase_price: albumForm.purchase_price ? parseFloat(albumForm.purchase_price) : undefined,
          condition: albumForm.condition || undefined,
          label: albumForm.label || undefined,
          catalog_number: albumForm.catalog_number || undefined,
          country: albumForm.country || undefined,
          format: albumForm.format || undefined,
          library_identifier: albumForm.library_identifier || undefined,
        },
        tracks: tracks.map((track, index) => ({
          track_id: track.track_id, // Include track_id for updates
          title: track.title,
          artist: track.artist || albumForm.artist,
          position: track.position || `${index + 1}`,
          duration_seconds: track.duration_seconds,
          bpm: track.bpm,
          key: track.key,
          notes: track.notes,
          local_tags: track.local_tags,
          star_rating: track.star_rating,
          apple_music_url: track.apple_music_url,
          spotify_url: track.spotify_url,
          youtube_url: track.youtube_url,
          soundcloud_url: track.soundcloud_url,
        })),
        friend_id: friendId,
        coverArt: coverArt,
      });

      toaster.create({
        title: 'Album updated',
        description: `Successfully updated "${albumForm.title}" with ${tracks.length} tracks`,
        type: 'success',
      });

      // Navigate back to album detail
      router.push(`/albums/${releaseId}?friend_id=${friendId}`);
    } catch (error) {
      toaster.create({
        title: 'Failed to update album',
        description: error instanceof Error ? error.message : 'An error occurred',
        type: 'error',
      });
    }
  };

  const handleCancel = () => {
    router.push(`/albums/${releaseId}?friend_id=${friendId}`);
  };

  if (!friendId) {
    return (
      <PageContainer size="standard" py={8}>
        <Text color="red.500">Error: friend_id parameter is required</Text>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer size="standard" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer size="standard" py={8}>
        <Text color="red.500">
          Error loading album: {error instanceof Error ? error.message : "Unknown error"}
        </Text>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      size="standard"
      py={{ base: 0, md: 4 }}
      mb={playlistLength > 0 ? "120px" : "0"}
    >
      <Stack gap={6}>
        <Heading size="2xl">Edit Album</Heading>

        <AlbumForm value={albumForm} onChange={setAlbumForm} />

        <CoverArtUpload value={coverArt} onChange={setCoverArt} />

        <TrackListBuilder
          tracks={tracks}
          onChange={setTracks}
          defaultArtist={albumForm.artist}
          defaultAlbum={albumForm.title}
        />

        <Flex gap={3} justify="flex-end" pt={4}>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            colorScheme="blue"
            loading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </Flex>
      </Stack>
    </PageContainer>
  );
}

export default function EditAlbumPage() {
  return (
    <Suspense
      fallback={
        <PageContainer size="standard" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" />
          </Flex>
        </PageContainer>
      }
    >
      <EditAlbumContent />
    </Suspense>
  );
}
