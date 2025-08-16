"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  HStack,
  Grid,
  Skeleton,
} from "@chakra-ui/react";
import TrackResult from "@/components/TrackResult";
import AppleResultRow from "@/components/AppleResultRow";
import { useMissingApple } from "@/providers/MissingAppleContext";
import { AppleMusicResult } from "@/types/apple";

export default function SingleTrackUI() {
  const {
    tracks,
    currentIndex,
    appleResults,
    overrideTrackId,
    overrideQuery,
    setOverrideTrackId,
    setOverrideQuery,
    saveTrack,
    currentGlobalIndex,
    total,
    goTo,
    prev,
    next,
    page,
  } = useMissingApple();
  const track = tracks[currentIndex];
  const [overrideResults, setOverrideResults] = useState<
    AppleMusicResult[] | null
  >(null);
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [gotoValue, setGotoValue] = useState<string | undefined>(undefined);

  console.log(page);

  useEffect(() => {
    setOverrideResults(null);
  }, [overrideTrackId, currentIndex]);

  if (!track) return null;
  const appleList = appleResults[track.track_id];
  const isOverride = overrideTrackId === track.track_id;

  const handleSaveFor = async (id: string, url: string) => {
    setSavingById((prev) => ({ ...prev, [id]: true }));
    await saveTrack({ ...track, apple_music_url: url });
    setSavingById((prev) => ({ ...prev, [id]: false }));
  };

  const goToIndex = () => {
    const desired = parseInt(gotoValue ?? String(page), 10) || 1;
    const max = total || tracks.length || 1;
    const n = Math.max(1, Math.min(max, desired));
    goTo(n - 1); // global, 0-based
  };

  return (
    <Box>
      <Flex align="center" gap={4} direction="column">
        <TrackResult track={track} allowMinimize={false} />

        <Box minW="240px" w="100%">
          <Flex mt={4} align="center" gap={4}>
            <Button
              size="xs"
              mt={2}
              mb={2}
              variant="outline"
              colorScheme="purple"
              onClick={() => {
                setOverrideTrackId(track.track_id);
                setOverrideQuery(`${track.title} ${track.artist}`);
              }}
            >
              {isOverride ? "Manual Search" : "Override Search"}
            </Button>
      <Flex flex="1 1 auto" w="100%" align="center" justifyContent="flex-end" gap={3}>
              <Button
        onClick={prev}
        disabled={currentGlobalIndex === 0}
                size="sm"
                variant="outline"
              >
                Prev
              </Button>
              <HStack gap={2} align="center">
                <Text fontSize="sm" color="gray.500">
                  Go to
                </Text>
                <Input
                  type="number"
                  size="sm"
                  width="90px"
                  value={gotoValue ? gotoValue : page}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setGotoValue(e.target.value);
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") goToIndex();
                  }}
                />
                <Text fontSize="sm" color="gray.500">/ {typeof total === "number" ? total : tracks.length}</Text>
                <Button size="sm" onClick={goToIndex}>
                  Go
                </Button>
              </HStack>
              <Button
                onClick={next}
                disabled={typeof total === "number" ? currentGlobalIndex === total - 1 : currentIndex === tracks.length - 1}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </Flex>
          </Flex>

          {isOverride && (
            <Box mt={2} mb={2} bg="gray.50" borderRadius="md">
              <HStack>
                <Input
                  value={overrideQuery}
                  onChange={(e) => setOverrideQuery(e.target.value)}
                  placeholder="Search Apple Music..."
                  size="sm"
                  flex={1}
                />
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={async () => {
                    const res = await fetch("/api/ai/apple-music-search", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: overrideQuery }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const results: AppleMusicResult[] = Array.isArray(
                        data.results
                      )
                        ? data.results
                        : data.results
                        ? [data.results[0]]
                        : [];
                      setOverrideResults(results);
                    } else {
                      setOverrideResults([]);
                    }
                  }}
                >
                  Search
                </Button>
                <Button
                  size="sm"
                  colorScheme="gray"
                  onClick={() => setOverrideTrackId(null)}
                >
                  Cancel
                </Button>
              </HStack>
            </Box>
          )}
          {isOverride ? (
            overrideResults === null ? (
              <></>
            ) : overrideResults.length === 0 ? (
              <Text color="red.500" fontSize="sm">
                No match
              </Text>
            ) : (
              <Box>
                {overrideResults.map((r) => (
                  <AppleResultRow
                    key={r.id}
                    result={r}
                    onSave={(url) => handleSaveFor(r.id, url)}
                    saving={!!savingById[r.id]}
                  />
                ))}
              </Box>
            )
          ) : appleList === undefined ? (
            <Box>
              {[...Array(3)].map((_, idx) => (
                <Grid
                  key={idx}
                  templateColumns="80px 1fr auto"
                  gap={3}
                  alignItems="center"
                  mb={3}
                >
                  <Skeleton height="80px" width="80px" borderRadius="md" />
                  <Box>
                    <Skeleton height="14px" width="60%" mb={1} />
                    <Skeleton height="12px" width="40%" mb={1} />
                    <Skeleton height="12px" width="50%" />
                  </Box>
                  <Skeleton height="24px" width="72px" borderRadius="md" />
                </Grid>
              ))}
            </Box>
          ) : appleList === null ? (
            <Text color="red.500" fontSize="sm">
              No match
            </Text>
          ) : (
            <Box>
              {appleList.map((apple) => (
                <AppleResultRow
                  key={apple.id}
                  result={apple}
                  onSave={(url) => handleSaveFor(apple.id, url)}
                  saving={!!savingById[apple.id]}
                />
              ))}
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
