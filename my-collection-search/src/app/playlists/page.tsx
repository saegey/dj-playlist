"use client";

import React from "react";
import PlaylistsProvider from "@/providers/PlaylistsProvider";
import { useMeili } from "@/providers/MeiliProvider";
import PlaylistManager from "@/components/PlaylistManager";
import PageContainer from "@/components/layout/PageContainer";

const PlaylistsPage = () => {
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

  return (
    <PageContainer size="standard">
      <PlaylistManager
        xmlImportModalOpen={false}
        setXmlImportModalOpen={function (): void {
          throw new Error("Function not implemented.");
        }}
        client={meiliClient}
      />
    </PageContainer>
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
