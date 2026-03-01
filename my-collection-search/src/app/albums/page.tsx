"use client";

import React, { Suspense } from "react";
import {
  Flex,
  Spinner,
  Button,
  NativeSelectRoot,
  NativeSelectField,
} from "@chakra-ui/react";
import { useSearchParams, useRouter } from "next/navigation";
import AlbumSearchResults from "@/components/AlbumSearchResults";
import PageContainer from "@/components/layout/PageContainer";
import UnifiedSearchControls from "@/components/search/UnifiedSearchControls";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useUsername } from "@/providers/UsernameProvider";

function AlbumsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { friend: currentUserFriend } = useUsername();

  const { friends } = useFriendsQuery({
    showCurrentUser: true,
  });

  const [query, setQuery] = React.useState(searchParams.get("q") || "");
  const [sort, setSort] = React.useState(
    searchParams.get("sort") || "date_added:desc"
  );
  const [selectedFriendId, setSelectedFriendId] = React.useState<number | null>(
    searchParams.get("friend_id")
      ? parseInt(searchParams.get("friend_id")!)
      : null
  );

  // Set default friend_id to current user's library on initial load
  React.useEffect(() => {
    if (!searchParams.get("friend_id") && currentUserFriend && !selectedFriendId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("friend_id", currentUserFriend.id.toString());
      if (query) params.set("q", query);
      if (sort !== "date_added:desc") params.set("sort", sort);
      router.replace(`/albums?${params.toString()}`);
    }
  }, [currentUserFriend, searchParams, selectedFriendId, router, query, sort]);

  // Get the selected Friend object for the UsernameSelect component
  const selectedFriend = React.useMemo(() => {
    if (!selectedFriendId) return null;
    return friends.find((f) => f.id === selectedFriendId) || null;
  }, [selectedFriendId, friends]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "date_added:desc") params.set("sort", sort);
    if (selectedFriendId) params.set("friend_id", selectedFriendId.toString());
    router.push(`/albums?${params.toString()}`);
  };

  const handleFriendChange = (friendId: number) => {
    // friendId === 0 means "All Libraries" was selected
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "date_added:desc") params.set("sort", sort);

    if (friendId > 0) {
      setSelectedFriendId(friendId);
      params.set("friend_id", friendId.toString());
    } else {
      // "All Libraries" selected - clear friend_id
      setSelectedFriendId(null);
    }

    router.push(`/albums?${params.toString()}`);
  };

  return (
    <PageContainer size="standard">
      <Flex gap={4} direction="column">
        <UnifiedSearchControls
          query={query}
          onQueryChange={setQuery}
          onQueryEnter={handleSearch}
          friends={friends}
          selectedFriend={selectedFriend}
          onFriendChange={handleFriendChange}
          includeAllOption={true}
          placeholder="Search albums..."
          desktopControls={
            <>
              <NativeSelectRoot width="220px" flexShrink={0}>
                <NativeSelectField
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="date_added:desc">Recently Added</option>
                  <option value="date_added:asc">Oldest First</option>
                  <option value="year:desc">Newest Releases</option>
                  <option value="year:asc">Oldest Releases</option>
                  <option value="title:asc">Title (A-Z)</option>
                  <option value="album_rating:desc">Highest Rated</option>
                </NativeSelectField>
              </NativeSelectRoot>
              <Button colorScheme="blue" onClick={handleSearch} flexShrink={0}>
                Search
              </Button>
            </>
          }
          mobilePrimaryControl={
            <Button
              colorScheme="blue"
              onClick={handleSearch}
              flexShrink={0}
              size="sm"
              px={3}
            >
              Go
            </Button>
          }
          mobileSecondaryControls={
            <NativeSelectRoot size="sm" minW="100%">
              <NativeSelectField
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                fontSize="sm"
              >
                <option value="date_added:desc">Recently Added</option>
                <option value="date_added:asc">Oldest First</option>
                <option value="year:desc">Newest Releases</option>
                <option value="year:asc">Oldest Releases</option>
                <option value="title:asc">Title (A-Z)</option>
                <option value="album_rating:desc">Highest Rated</option>
              </NativeSelectField>
            </NativeSelectRoot>
          }
        />

        {/* Album Results */}
        <Suspense
          fallback={
            <Flex justify="center" pt={6}>
              <Spinner />
            </Flex>
          }
        >
          <AlbumSearchResults />
        </Suspense>
      </Flex>
    </PageContainer>
  );
}

export default function AlbumsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AlbumsPageContent />
    </Suspense>
  );
}
