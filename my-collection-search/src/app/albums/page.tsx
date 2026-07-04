"use client";

import React, { Suspense } from "react";
import {
  Flex,
  Spinner,
  Button,
  IconButton,
  Menu,
} from "@chakra-ui/react";
import { LuArrowUpDown } from "react-icons/lu";
import { useSearchParams, useRouter } from "next/navigation";
import AlbumSearchResults from "@/components/AlbumSearchResults";
import PageContainer from "@/components/layout/PageContainer";
import UnifiedSearchControls from "@/components/search/UnifiedSearchControls";
import FilterChips from "@/components/FilterChips";
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
  const [viewMode, setViewMode] = React.useState<"card" | "table">("card");

  React.useEffect(() => {
    const saved = localStorage.getItem("albumViewMode");
    if (saved === "card" || saved === "table") setViewMode(saved);
  }, []);

  const [selectedFriendId, setSelectedFriendId] = React.useState<number | null>(
    searchParams.get("friend_id")
      ? parseInt(searchParams.get("friend_id")!)
      : null
  );

  const missingLibraryIdentifier = searchParams.get("missing_library_identifier") === "1";
  const missingLocalCoverArtUrl = searchParams.get("missing_local_cover_art_url") === "1";
  const missingAudio = searchParams.get("missing_audio") === "1";

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

  const buildParams = (overrides: Record<string, string | null> = {}) => {
    const params = new URLSearchParams();
    const effectiveQuery = overrides.q !== undefined ? overrides.q : query;
    const effectiveSort = overrides.sort !== undefined ? overrides.sort : sort;
    const effectiveFriendId = overrides.friend_id !== undefined ? overrides.friend_id : selectedFriendId?.toString() ?? null;
    if (effectiveQuery) params.set("q", effectiveQuery);
    if (effectiveSort && effectiveSort !== "date_added:desc") params.set("sort", effectiveSort);
    if (effectiveFriendId) params.set("friend_id", effectiveFriendId);
    if (missingLibraryIdentifier) params.set("missing_library_identifier", "1");
    if (missingLocalCoverArtUrl) params.set("missing_local_cover_art_url", "1");
    if (missingAudio) params.set("missing_audio", "1");
    return params;
  };

  const handleSearch = () => router.push(`/albums?${buildParams().toString()}`);

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    router.push(`/albums?${buildParams({ sort: newSort }).toString()}`);
  };

  const handleFriendChange = (friendId: number) => {
    // friendId === 0 means "All Libraries" was selected
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "date_added:desc") params.set("sort", sort);
    if (missingLibraryIdentifier) params.set("missing_library_identifier", "1");
    if (missingLocalCoverArtUrl) params.set("missing_local_cover_art_url", "1");
    if (missingAudio) params.set("missing_audio", "1");

    if (friendId > 0) {
      setSelectedFriendId(friendId);
      params.set("friend_id", friendId.toString());
    } else {
      // "All Libraries" selected - clear friend_id
      setSelectedFriendId(null);
    }

    router.push(`/albums?${params.toString()}`);
  };

  const handleAlbumFilterToggle = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "missingIdentifier") {
      if (!missingLibraryIdentifier) {
        params.set("missing_library_identifier", "1");
      } else {
        params.delete("missing_library_identifier");
      }
    }
    if (key === "missingLocalCoverArtUrl") {
      if (!missingLocalCoverArtUrl) {
        params.set("missing_local_cover_art_url", "1");
      } else {
        params.delete("missing_local_cover_art_url");
      }
    }
    if (key === "missingAudio") {
      if (!missingAudio) {
        params.set("missing_audio", "1");
      } else {
        params.delete("missing_audio");
      }
    }
    router.replace(`/albums?${params.toString()}`);
  };

  return (
    <PageContainer size="standard">
      <Flex gap={3} direction="column">
        <UnifiedSearchControls
          query={query}
          onQueryChange={setQuery}
          onQueryEnter={handleSearch}
          friends={friends}
          selectedFriend={selectedFriend}
          onFriendChange={handleFriendChange}
          includeAllOption={true}
          placeholder="Search"
          compactDesktop={true}
          desktopControls={
            <>
              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton aria-label="Sort" size="sm" variant="ghost">
                    <LuArrowUpDown />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    {[
                      { value: "date_added:desc", label: "Recently Added" },
                      { value: "date_added:asc", label: "Oldest First" },
                      { value: "year:desc", label: "Newest Releases" },
                      { value: "year:asc", label: "Oldest Releases" },
                      { value: "title:asc", label: "Title (A-Z)" },
                      { value: "album_rating:desc", label: "Highest Rated" },
                    ].map((opt) => (
                      <Menu.Item
                        key={opt.value}
                        value={opt.value}
                        onSelect={() => handleSortChange(opt.value)}
                        fontWeight={sort === opt.value ? "bold" : "normal"}
                      >
                        {opt.label}
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
              <Button variant="outline" flexShrink={0} onClick={() => router.push("/albums/add")}>
                + Add Album
              </Button>
            </>
          }
          mobilePrimaryControl={
            <Flex gap={1} align="center" flexShrink={0}>
              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton aria-label="Sort" size="sm" variant="ghost">
                    <LuArrowUpDown />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    {[
                      { value: "date_added:desc", label: "Recently Added" },
                      { value: "date_added:asc", label: "Oldest First" },
                      { value: "year:desc", label: "Newest Releases" },
                      { value: "year:asc", label: "Oldest Releases" },
                      { value: "title:asc", label: "Title (A-Z)" },
                      { value: "album_rating:desc", label: "Highest Rated" },
                    ].map((opt) => (
                      <Menu.Item
                        key={opt.value}
                        value={opt.value}
                        onSelect={() => handleSortChange(opt.value)}
                        fontWeight={sort === opt.value ? "bold" : "normal"}
                      >
                        {opt.label}
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </Flex>
          }
        />

        <FilterChips
          chips={[
            { key: "missingIdentifier", label: "Missing identifier", active: missingLibraryIdentifier },
            {
              key: "missingLocalCoverArtUrl",
              label: "Missing local cover",
              active: missingLocalCoverArtUrl,
            },
            { key: "missingAudio", label: "Missing audio", active: missingAudio },
          ]}
          onToggle={handleAlbumFilterToggle}
          onClearAll={missingLibraryIdentifier || missingLocalCoverArtUrl || missingAudio ? () => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("missing_library_identifier");
            params.delete("missing_local_cover_art_url");
            params.delete("missing_audio");
            router.replace(`/albums?${params.toString()}`);
          } : undefined}
        />

        {/* Album Results */}
        <Suspense
          fallback={
            <Flex justify="center" pt={6}>
              <Spinner />
            </Flex>
          }
        >
          <AlbumSearchResults viewMode={viewMode} />
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
