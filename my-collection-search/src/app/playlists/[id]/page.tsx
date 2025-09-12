"use client";

import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

import PlaylistViewer from "@/components/PlaylistViewer";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// This is a server component by default. Add 'use client' at the top if you need client-side interactivity.
const PlaylistPage = ({ params }: PlaylistPageProps) => {
  const { id } = React.use(params);

  return (
    <Box maxW="700px" mx="auto" p={["12px", 8]}>
      <PlaylistViewer playlistId={Number(id)} />
      {/* Future ideas:
          - Show playlist name, track count, total duration
          - Actions: play all, shuffle, export, edit name
          - Track list with drag reorder
       */}
    </Box>
  );
};
export default PlaylistPage;
