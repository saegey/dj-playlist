"use client";

import PlaylistsProvider from "@/providers/PlaylistsProvider";
import PlaylistManager from "@/components/PlaylistManager";
import PageContainer from "@/components/layout/PageContainer";

const PlaylistsPage = () => {
  return (
    <PageContainer size="standard">
      <PlaylistManager
        xmlImportModalOpen={false}
        setXmlImportModalOpen={function (): void {
          throw new Error("Function not implemented.");
        }}
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
