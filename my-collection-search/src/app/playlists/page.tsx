"use client";

import React, { useState, useRef } from "react";
import { Box } from "@chakra-ui/react";

import { useSearchResults } from "@/hooks/useSearchResults";
import PlaylistsProvider from "@/hooks/usePlaylists";
import type { Track } from "@/types/track";
import { TrackEditFormProps } from "../../components/TrackEditForm";
import TrackEditDialog from "@/components/TrackEditDialog";
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";
import PlaylistManager from "@/components/PlaylistManager";

// TrackEditForm is used via TrackEditDialog
const SearchPage = () => {
  // sidebar open state is managed by PlaylistDrawer context
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

  const { username: selectedUsername } = useUsername();
  const { needsRefresh } = useSearchResults({
    client: meiliClient,
    username: selectedUsername,
  });

  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const handleSaveTrack = async (data: TrackEditFormProps) => {
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setEditTrack(null);
      setDialogOpen(false);
      needsRefresh();
      // Refresh search results after saving track
    } else {
      alert("Failed to update track");
    }
  };

  return (
    <>
      <Box maxW="700px" mx="auto" p={["12px", 8]}>
        <PlaylistManager
          xmlImportModalOpen={false}
          setXmlImportModalOpen={function (): void {
            throw new Error("Function not implemented.");
          }}
          client={meiliClient}
        />
      </Box>

      <TrackEditDialog
        editTrack={editTrack}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        initialFocusRef={initialFocusRef}
        onSave={handleSaveTrack}
      />
    </>
  );
};

const SearchPageWrapper = () => {
  return (
    <PlaylistsProvider>
      <SearchPage />
    </PlaylistsProvider>
  );
};
export default SearchPageWrapper;
