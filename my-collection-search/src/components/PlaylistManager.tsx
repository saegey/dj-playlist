"use client";

import React from "react";
import { Box, Flex, Input, Text, Button } from "@chakra-ui/react";
import AppleMusicXmlImport from "@/components/AppleMusicXmlImport";

export type Playlist = {
  id: number;
  name: string;
  tracks: string[];
};

type PlaylistManagerProps = {
  playlists: Playlist[];
  loadingPlaylists: boolean;
  playlistName: string;
  setPlaylistName: (name: string) => void;
  handleCreatePlaylist: () => void;
  handleLoadPlaylist: (trackIds: string[]) => void;
  handleDeletePlaylist: (id: number) => void;
  xmlImportModalOpen: boolean;
  setXmlImportModalOpen: (open: boolean) => void;
  client: unknown;
  fetchPlaylists: () => void;
};

const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  loadingPlaylists,
  playlistName,
  setPlaylistName,
  handleCreatePlaylist,
  handleLoadPlaylist,
  handleDeletePlaylist,
  xmlImportModalOpen,
  setXmlImportModalOpen,
  client,
  fetchPlaylists,
}) => {
  return (
    <Box minWidth="220px" mr={4}>
      <Text fontSize={"lg"} fontWeight="bold" mb={4}>
        Playlist Maker Pro Edition
      </Text>
      <Flex mb={2} gap={2}>
        <Input
          size="sm"
          placeholder="New playlist name"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleCreatePlaylist}
          isDisabled={!playlistName.trim()}
        >
          Save
        </Button>
      </Flex>
      <Box
        overflowY="auto"
        borderWidth="1px"
        borderRadius="md"
        p={2}
        bg="gray.50"
      >
        <Box>
          {loadingPlaylists ? (
            <Text fontSize="sm">Loading...</Text>
          ) : playlists.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No saved playlists.
            </Text>
          ) : (
            playlists.map((pl: Playlist) => (
              <Flex
                key={pl.id}
                justify="space-between"
                mb={1}
                flexDirection={"column"}
              >
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="bold" isTruncated>
                    {pl.name}
                  </Text>
                </Box>
                <Flex>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    mr={1}
                    onClick={() => handleLoadPlaylist(pl.tracks)}
                  >
                    Load
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="gray"
                    onClick={() => handleDeletePlaylist(pl.id)}
                  >
                    Delete
                  </Button>
                </Flex>
              </Flex>
            ))
          )}
        </Box>
      </Box>
      <Button
        mt={6}
        colorScheme="purple"
        size="sm"
        width="100%"
        onClick={() => setXmlImportModalOpen(true)}
      >
        Import Apple Music XML
      </Button>
      <AppleMusicXmlImport
        isOpen={xmlImportModalOpen}
        onClose={() => setXmlImportModalOpen(false)}
        client={client}
        fetchPlaylists={fetchPlaylists}
      />
    </Box>
  );
};

export default PlaylistManager;
