// components/PlaylistPlayer.tsx
"use client";

import React from "react";
import { Box } from "@chakra-ui/react";
import PlayerControls from "@/components/PlayerControls";
import QueueDrawer from "@/components/QueueDrawer";
import { useQueueDrawer } from "@/hooks/useQueueDrawer";

export const PlayerContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex={100}
      bg={"bg"}
      borderTopWidth="1px"
      borderColor={"brand.0"}
      background={"bg"}
    >
      <Box
        maxW="1200px"
        mx="auto"
        px={{ base: 3, md: 6 }}
        py={{ base: 2, md: 3 }}
      >
        {children}
      </Box>
    </Box>
  );
};


const PlaylistPlayer: React.FC = () => {
  const { isOpen, toggle } = useQueueDrawer();

  return (
    <>
      {/* Spacer so your page content isn't hidden behind the fixed bar */}
      <Box h={{ base: "72px", md: "84px" }} />

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
