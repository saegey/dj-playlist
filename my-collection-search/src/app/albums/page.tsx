"use client";

import React, { Suspense } from "react";
import {
  Flex,
  Container,
  Spinner,
  Box,
  Input,
  Button,
  NativeSelectRoot,
  NativeSelectField,
  InputGroup,
} from "@chakra-ui/react";
import { useSearchParams, useRouter } from "next/navigation";
import AlbumSearchResults from "@/components/AlbumSearchResults";
import UsernameSelect from "@/components/UsernameSelect";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useUsername } from "@/providers/UsernameProvider";
import { LuSearch } from "react-icons/lu";

function AlbumsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { friend: currentUserFriend } = useUsername();

  const { friends } = useFriendsQuery({
    showCurrentUser: true,
    showSpotifyUsernames: true,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Container maxW="container.xl" px={0}>
      <Flex gap={4} direction="column">
        {/* Search Controls */}
        <Box pt={4}>
          <Flex gap={2} direction="column" mb={2}>
            {/* Row 1: Search Input + User + Search Button (Mobile) */}
            <Flex gap={2} display={{ base: "flex", md: "none" }}>
              <InputGroup
                startElement={<LuSearch size={16} />}
                flex="1"
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  variant={"subtle"}
                  fontSize="16px"
                  size="sm"
                />
              </InputGroup>
              <UsernameSelect
                usernames={friends}
                includeAllOption={true}
                onChange={handleFriendChange}
                value={selectedFriend}
                size="sm"
                iconOnlyMobile={true}
                width="auto"
              />
              <Button
                colorScheme="blue"
                onClick={handleSearch}
                flexShrink={0}
                size="sm"
                px={3}
              >
                Go
              </Button>
            </Flex>

            {/* Row 2: Sort Dropdown (Mobile) */}
            <NativeSelectRoot
              display={{ base: "block", md: "none" }}
              size="sm"
            >
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

            {/* Desktop Layout */}
            <Flex gap={2} display={{ base: "none", md: "flex" }}>
              <InputGroup
                startElement={<LuSearch size={16} />}
                flex="1"
                maxW="400px"
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  variant={"subtle"}
                  fontSize="16px"
                />
              </InputGroup>

              <Box width="200px" flexShrink={0}>
                <UsernameSelect
                  usernames={friends}
                  includeAllOption={true}
                  onChange={handleFriendChange}
                  value={selectedFriend}
                  size="md"
                />
              </Box>

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

              <Button
                colorScheme="blue"
                onClick={handleSearch}
                flexShrink={0}
              >
                Search
              </Button>
            </Flex>
          </Flex>
        </Box>

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
    </Container>
  );
}

export default function AlbumsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AlbumsPageContent />
    </Suspense>
  );
}
