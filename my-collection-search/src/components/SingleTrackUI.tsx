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
  Menu,
  Portal,
} from "@chakra-ui/react";
import AppleResultRow from "@/components/AppleResultRow";
import { useMissingApple } from "@/providers/MissingAppleContext";
import { AppleMusicResult } from "@/types/apple";
import {
  DiscogsLookupRelease,
  DiscogsVideo,
} from "@/providers/MissingAppleContext";
import { FiChevronLeft, FiChevronRight, FiMoreVertical } from "react-icons/fi";
import { toaster } from "@/components/ui/toaster";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import { useAppleMusicAISearchQuery } from "@/hooks/useAppleMusicAISearchQuery";
import TrackResultStore from "./TrackResultStore";

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
    lookupDiscogs,
    discogsByTrack,
  } = useMissingApple();
  const { openTrackEditor } = useTrackEditor();

  const track = tracks[currentIndex];
  const [overrideResults, setOverrideResults] = useState<
    AppleMusicResult[] | null
  >(null);
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [gotoValue, setGotoValue] = useState<string | undefined>(undefined);
  const [toggleDiscogs, setToggleDiscogs] = useState(false);
  // Enable AI Apple Music search only when manual override is active and query is present
  const enabledAppleAi = !!overrideQuery && overrideTrackId != null;
  const { isFetching: aiAppleLoading, refetch: refetchAiApple } =
    useAppleMusicAISearchQuery({ title: overrideQuery }, enabledAppleAi);

  useEffect(() => {
    setOverrideResults(null);
  }, [overrideTrackId, currentIndex]);

  if (!track) return null;
  const appleList = appleResults[track.track_id];
  const isOverride = overrideTrackId === track.track_id;

  const handleSaveFor = async (
    id: string,
    url: string,
    type: "apple" | "youtube"
  ) => {
    setSavingById((prev) => ({ ...prev, [id]: true }));
    if (type === "apple") {
      await saveTrack({ ...track, apple_music_url: url });
    } else if (type === "youtube") {
      await saveTrack({ ...track, youtube_url: url });
    }
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
        <TrackResultStore
          key={`${track.track_id}:${track.username || 'default'}`} // Force re-render on track change
          trackId={track.track_id}
          username={track.username || 'default'} // Ensure username is never undefined
          fallbackTrack={track}
          allowMinimize={false}
          buttons={[
            <Menu.Root key="menu">
              <Menu.Trigger asChild>
                <Button variant="plain" size={["xs", "sm", "md"]}>
                  <FiMoreVertical />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    {track && (
                      <Menu.Item
                        onSelect={() => openTrackEditor(track)}
                        value="edit"
                      >
                        Edit Track
                      </Menu.Item>
                    )}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>,
          ]}
        />

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
              colorPalette="orange"
            >
              {isOverride ? "Manual Search" : "Override Search"}
            </Button>
            <Button
              size="xs"
              mt={2}
              mb={2}
              variant="outline"
              colorPalette="purple"
              onClick={async () => {
                const data = await lookupDiscogs(track.track_id);
                const rel = data?.release as DiscogsLookupRelease | undefined;
                const vids: DiscogsVideo[] = (rel?.videos ??
                  rel?.video ??
                  []) as DiscogsVideo[];
                if (!vids || vids.length === 0) {
                  toaster.create({ title: "No videos found", type: "warning" });
                } else {
                  setToggleDiscogs((v) => !v);
                }
              }}
            >
              {toggleDiscogs ? "Hide" : "Show"} Discogs
            </Button>
            <Flex
              flex="1 1 auto"
              w="100%"
              align="center"
              justifyContent="flex-end"
              gap={3}
            >
              <Button
                onClick={prev}
                disabled={currentGlobalIndex === 0}
                size="sm"
                variant="outline"
              >
                <FiChevronLeft />
              </Button>
              <HStack gap={2} align="center">
                <Input
                  //   type="number"
                  size="sm"
                  width="60px"
                  value={gotoValue ? gotoValue : page}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setGotoValue(e.target.value);
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") goToIndex();
                  }}
                />
                <Text fontSize="sm" color="gray.500">
                  / {typeof total === "number" ? total : tracks.length}
                </Text>
                <Button size="sm" onClick={goToIndex}>
                  Go
                </Button>
              </HStack>
              <Button
                onClick={next}
                disabled={
                  typeof total === "number"
                    ? currentGlobalIndex === total - 1
                    : currentIndex === tracks.length - 1
                }
                size="sm"
                variant="outline"
              >
                <FiChevronRight />
              </Button>
            </Flex>
          </Flex>

          {/* Discogs videos, if available */}
          {toggleDiscogs &&
            discogsByTrack?.[track.track_id]?.release &&
            (() => {
              const rel = discogsByTrack[track.track_id]!
                .release as DiscogsLookupRelease;
              const vids: DiscogsVideo[] = (rel.videos ??
                rel.video ??
                []) as DiscogsVideo[];
              if (!vids || vids.length === 0) return null;
              return (
                <Box mt={3} mb={2}>
                  <Text fontWeight="semibold" fontSize="sm" mb={2}>
                    Discogs Videos
                  </Text>
                  {vids.map((v, i) => (
                    <AppleResultRow
                      key={i}
                      result={{
                        id: String(i),
                        title: v.title || track.title,
                        artist: track.artist,
                        album: track.album,
                        url: (v.uri || v.url) ?? "#",
                        // Discogs durations are in seconds; AppleResultRow expects ms
                        duration:
                          typeof v.duration === "number"
                            ? v.duration * 1000
                            : undefined,
                      }}
                      onSave={(url) => handleSaveFor(String(i), url, "youtube")}
                    />
                  ))}
                </Box>
              );
            })()}

          {isOverride && (
            <Box mt={2} mb={2} borderRadius="md">
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
                  loading={aiAppleLoading}
                  disabled={!overrideQuery}
                  onClick={async () => {
                    const { data } = await refetchAiApple();
                    const results: AppleMusicResult[] = Array.isArray(
                      data?.results
                    )
                      ? (data?.results as AppleMusicResult[])
                      : data?.results
                      ? [data.results[0] as AppleMusicResult]
                      : [];
                    setOverrideResults(results);
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
                <Text fontWeight="semibold" fontSize="sm" mb={2}>
                  Apple Music Results
                </Text>
                {overrideResults.map((r) => (
                  <AppleResultRow
                    key={r.id}
                    result={r}
                    onSave={(url) => handleSaveFor(r.id, url, "apple")}
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
            <>
              <Text fontWeight="semibold" fontSize="sm" mb={2}>
                Apple Music Results
              </Text>
              <Text color="red.500" fontSize="sm">
                No match
              </Text>
            </>
          ) : (
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={2}>
                Apple Music Results
              </Text>
              {appleList.map((apple) => (
                <AppleResultRow
                  key={apple.id}
                  result={apple}
                  onSave={(url) => handleSaveFor(apple.id, url, "apple")}
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
