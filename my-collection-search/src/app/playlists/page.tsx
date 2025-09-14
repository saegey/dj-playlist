"use client";

import React from "react";
import { Box } from "@chakra-ui/react";

import PlaylistsProvider from "@/providers/PlaylistsProvider";
import { useMeili } from "@/providers/MeiliProvider";
import PlaylistManager from "@/components/PlaylistManager";

const PlaylistsPage = () => {
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

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
    </>
  );
};

const SearchPageWrapper = () => {
  return (
    <PlaylistsProvider>
      <PlaylistsPage />
    </PlaylistsProvider>
  );
};
export default SearchPageWrapper;
