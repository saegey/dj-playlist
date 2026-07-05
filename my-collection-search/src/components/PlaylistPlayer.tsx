// components/PlaylistPlayer.tsx
"use client";

import React from "react";
import { Box, useBreakpointValue } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import PlayerControls from "@/components/PlayerControls";
import QueueDrawer from "@/components/QueueDrawer";
import { useQueueDrawer } from "@/hooks/useQueueDrawer";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";

function isMobileFullscreenEditRoute(pathname: string) {
  return (
    (pathname.startsWith("/tracks/") || pathname.startsWith("/albums/")) &&
    pathname.endsWith("/edit")
  );
}

export const PlayerContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Box
      position="fixed"
      bottom={{ base: "calc(env(safe-area-inset-bottom, 0px) + 90px)", md: 4 }}
      left="50%"
      transform="translateX(-50%)"
      zIndex={100}
      width={{ base: "calc(100% - 32px)", md: "calc(100% - 80px)" }}
      maxW="920px"
      borderRadius={{ base: "24px", md: "2xl" }}
      overflow="hidden"
      borderWidth="1px"
      borderColor="border.subtle"
      boxShadow="0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)"
      _light={{ bg: "rgba(255,255,255,0.82)" }}
      _dark={{ bg: "rgba(18,18,24,0.82)" }}
      style={{ backdropFilter: "blur(20px) saturate(180%)" }}
      px={{ base: 2.5, md: 5 }}
      py={{ base: 1.5, md: 3 }}
    >
      {children}
    </Box>
  );
};


const PlaylistPlayer: React.FC = () => {
  const { isOpen, toggle } = useQueueDrawer();
  const { playlistLength } = usePlaylistPlayer();
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const pathname = usePathname();
  const currentPath = pathname ? pathname.split("?")[0] : "";
  const hideForMobileEdit = isMobile && isMobileFullscreenEditRoute(currentPath);

  // Hide player if queue is empty
  if (playlistLength === 0 || hideForMobileEdit) {
    return null;
  }

  return (
    <>
      {/* Spacer so page content scrolls clear of the floating player */}
      <Box h={{ base: "96px", md: "100px" }} />

      {/* Original Player - hide when queue drawer is open */}
      {!isOpen && (
        <PlayerContainer>
          <PlayerControls
            showQueueButton={true}
            onQueueToggle={toggle}
            isQueueOpen={isOpen}
            compact={isMobile}
            showVolumeControls={!isMobile}
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
