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
import { LuSearch } from "react-icons/lu";

function AlbumsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "date_added:desc") params.set("sort", sort);
    if (selectedFriendId) params.set("friend_id", selectedFriendId.toString());
    router.push(`/albums?${params.toString()}`);
  };

  const handleFriendChange = (friendId: number) => {
    setSelectedFriendId(friendId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("friend_id", friendId.toString());
    if (query) params.set("q", query);
    if (sort !== "date_added:desc") params.set("sort", sort);
    router.push(`/albums?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Container maxW="container.xl">
      <Flex gap={4} direction="column">
        {/* Search Controls */}
        <Box pt={4}>
          <Flex gap={2} direction={{ base: "column", md: "row" }} mb={2}>
            {/* Search Input - First */}
            <InputGroup
              startElement={<LuSearch size={16} />}
              flex={{ base: "1", md: "1" }}
              maxW={{ base: "full", md: "400px" }}
            >
              <Input
                placeholder="Search albums..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                variant={"subtle"}
                fontSize="16px"
              />
            </InputGroup>

            {/* Friends/Username Selector - Second */}
            <Box width={{ base: "full", md: "200px" }} flexShrink={0}>
              <UsernameSelect
                usernames={friends}
                includeAllOption={true}
                onChange={handleFriendChange}
                size={["sm", "md", "md"]}
              />
            </Box>

            {/* Sort Dropdown */}
            <NativeSelectRoot width={{ base: "full", md: "220px" }} flexShrink={0}>
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

            {/* Search Button */}
            <Button colorScheme="blue" onClick={handleSearch} flexShrink={0}>
              Search
            </Button>
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
