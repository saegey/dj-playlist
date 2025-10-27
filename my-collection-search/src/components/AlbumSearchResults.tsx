"use client";
import React, { useEffect, useRef } from "react";
import { Box, Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { useAlbumsInfiniteQuery } from "@/hooks/useAlbumsQuery";
import AlbumResult from "./AlbumResult";
import { useSearchParams } from "next/navigation";

export default function AlbumSearchResults() {
  const searchParams = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);

  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "date_added:desc";
  const friendId = searchParams.get("friend_id");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useAlbumsInfiniteQuery({
      q: query,
      sort,
      friend_id: friendId ? parseInt(friendId) : undefined,
      limit: 20,
    });

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">Error loading albums: {error.message}</Text>
      </Box>
    );
  }

  const albums = data?.pages.flatMap((page) => page.hits) || [];
  const totalHits = data?.pages[0]?.estimatedTotalHits || 0;

  if (albums.length === 0) {
    return (
      <Box p={4}>
        <Text color="gray.500">No albums found.</Text>
        {query && (
          <Text fontSize="sm" color="gray.400" mt={2}>
            Try adjusting your search or filters.
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Results count */}
      <Flex justify="space-between" align="center" mb={4} px={2}>
        <Text fontSize="sm" color="gray.600">
          {totalHits.toLocaleString()} {totalHits === 1 ? "album" : "albums"}
        </Text>
        {query && (
          <Text fontSize="sm" color="gray.500">
            Search: &quot;{query}&quot;
          </Text>
        )}
      </Flex>

      {/* Album results */}
      <Box>
        {albums.map((album) => (
          <AlbumResult
            key={`${album.release_id}_${album.friend_id}`}
            album={album}
            showEditFields={true}
          />
        ))}
      </Box>

      {/* Infinite scroll trigger */}
      <Box ref={observerTarget} py={4}>
        {isFetchingNextPage && (
          <Flex justify="center">
            <Spinner />
          </Flex>
        )}
        {!hasNextPage && albums.length > 0 && (
          <Text textAlign="center" color="gray.500" fontSize="sm">
            End of results
          </Text>
        )}
      </Box>

      {/* Manual load more button (backup for infinite scroll) */}
      {hasNextPage && !isFetchingNextPage && (
        <Flex justify="center" mt={4}>
          <Button onClick={() => fetchNextPage()} variant="outline">
            Load More
          </Button>
        </Flex>
      )}
    </Box>
  );
}
