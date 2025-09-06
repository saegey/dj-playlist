"use client";

import React from "react";
import PlaylistViewer from "@/components/PlaylistViewer";
import { usePlaylists } from "@/hooks/usePlaylists";
import { usePlaylistTracksByIdQuery } from "@/hooks/usePlaylistTrackIdsQuery";
import { Box } from "@chakra-ui/react";
import { useEffect } from "react";

interface PlaylistPageProps {
  params: Promise<{ id: string }> | { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

// This is a server component by default. Add 'use client' at the top if you need client-side interactivity.
const PlaylistPage = ({ params }: PlaylistPageProps) => {
  const resolvedParams = React.use(params as Promise<{ id: string }>);
  const { id } = resolvedParams ?? (params as { id: string });
  const { tracks, isLoading } = usePlaylistTracksByIdQuery(id);
  const { setPlaylist } = usePlaylists();

  useEffect(() => {
    if (!isLoading && tracks) {
      setPlaylist(tracks);
    }
  }, [isLoading, tracks, setPlaylist]);

  if (isLoading) {
    return <Box>Loading playlist...</Box>;
  }

  if (!tracks) {
    return <Box>Playlist not found or has no tracks.</Box>;
  }


  // Placeholder: you can fetch playlist details here later
  // const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/playlists/${id}`, { cache: 'no-store' });
  // const playlist = res.ok ? await res.json() : null;

  return (
    <Box maxW="700px" mx="auto" p={["12px", 8]}>
      <h1>Playlist {id}</h1>
      <PlaylistViewer />
      {/* Future ideas:
          - Show playlist name, track count, total duration
          - Actions: play all, shuffle, export, edit name
          - Track list with drag reorder
       */}
    </Box>
  );
};
export default PlaylistPage;
