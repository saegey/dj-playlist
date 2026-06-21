// components/PlaylistPlayer.tsx
"use client";

import React from "react";
import { Box } from "@chakra-ui/react";
import PlayerControls from "@/components/PlayerControls";
import QueueDrawer from "@/components/QueueDrawer";
import { useQueueDrawer } from "@/hooks/useQueueDrawer";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";

export const PlayerContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Box
      position="fixed"
      bottom={{ base: 3, md: 4 }}
      left="50%"
      transform="translateX(-50%)"
      zIndex={100}
      width={{ base: "calc(100% - 32px)", md: "calc(100% - 80px)" }}
      maxW="920px"
      borderRadius="2xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor="border.subtle"
      boxShadow="0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)"
      _light={{ bg: "rgba(255,255,255,0.82)" }}
      _dark={{ bg: "rgba(18,18,24,0.82)" }}
      style={{ backdropFilter: "blur(20px) saturate(180%)" }}
      px={{ base: 3, md: 5 }}
      py={{ base: 2, md: 3 }}
    >
      {children}
    </Box>
  );
};


const PlaylistPlayer: React.FC = () => {
  const { isOpen, toggle } = useQueueDrawer();
  const { playlistLength } = usePlaylistPlayer();

  // Hide player if queue is empty
  if (playlistLength === 0) {
    return null;
  }

  return (
    <>
      {/* Spacer so page content scrolls clear of the floating player */}
      <Box h={{ base: "88px", md: "100px" }} />

      {/* Original Player - hide when queue drawer is open */}
      {!isOpen && (
        <PlayerContainer>
          <PlayerControls
            showQueueButton={true}
            onQueueToggle={toggle}
            isQueueOpen={isOpen}
            compact={false}
            showVolumeControls={true}
          />
        </PlayerContainer>
      )}

      {/* Queue Drawer with embedded player */}
      <QueueDrawer
        isOpen={isOpen}
        onClose={() => toggle()}
        onQueueToggle={toggle}
        isQueueOpen={isOpen}
      />
    </>
  );
};

export default PlaylistPlayer;
