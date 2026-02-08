"use client";

import React from "react";
import {
  Container,
  Heading,
  Spinner,
  Text,
  Badge,
  Box,
  SimpleGrid,
  Card,
  Stack,
  Button,
  Progress,
  VStack,
  HStack,
  Flex,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { LuInfo, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import { useJobsQuery } from "@/hooks/useJobsQuery";
import { useMutation } from "@tanstack/react-query";
import { clearAllJobs, type JobInfo } from "@/services/jobsService";
import TrackResultStore from "@/components/TrackResultStore";
import type { Track } from "@/types/track";

export default function JobsPage() {
  const { data, isLoading, refetch, dataUpdatedAt } = useJobsQuery();
  const [detailsJob, setDetailsJob] = React.useState<JobInfo | null>(null);

  const clearJobsMutation = useMutation({
    mutationFn: clearAllJobs,
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to clear jobs:", error);
    },
  });

  const jobs = data?.jobs || [];
  const summary = data?.summary || {
    total: 0,
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  };

  const getStateBadge = (state: string) => {
    const colorScheme =
      {
        waiting: "blue",
        active: "orange",
        completed: "green",
        failed: "red",
      }[state] || "gray";

    return (
      <Badge colorScheme={colorScheme} variant="subtle">
        {state.charAt(0).toUpperCase() + state.slice(1)}
      </Badge>
    );
  };

  const getDownloaderInfo = (job: { data?: Record<string, unknown> }) => {
    const data = job.data || {};

    // Determine which downloader will be used based on available URLs
    if (data.apple_music_url) {
      return {
        name: "gamdl",
        source: "Apple Music",
        color: "purple" as const,
        quality: String(data.quality || "best")
      };
    } else if (data.youtube_url) {
      return {
        name: "yt-dlp",
        source: "YouTube",
        color: "red" as const,
        quality: "audio"
      };
    } else if (data.soundcloud_url) {
      return {
        name: "yt-dlp",
        source: "SoundCloud",
        color: "orange" as const,
        quality: "audio"
      };
    } else if (data.spotify_url) {
      return {
        name: "spotdl",
        source: "Spotify",
        color: "green" as const,
        quality: "320k"
      };
    }

    return {
      name: "unknown",
      source: "Unknown",
      color: "gray" as const,
      quality: "unknown"
    };
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start?: number, end?: number) => {
    if (!start || !end) return "-";
    const duration = Math.round((end - start) / 1000);
    return `${duration}s`;
  };

  const buildFallbackTrack = (job: (typeof jobs)[number]): Track => {
    const fromResultTitle =
      typeof job?.returnvalue === "object" &&
      job?.returnvalue &&
      (job.returnvalue as Record<string, unknown>).title;
    const fromResultArtist =
      typeof job?.returnvalue === "object" &&
      job?.returnvalue &&
      (job.returnvalue as Record<string, unknown>).artist;

    return {
      id: 0,
      track_id: job.data.track_id,
      title:
        (job.data.title as string | undefined) ||
        (fromResultTitle as string | undefined) ||
        job.data.track_id,
      artist:
        (job.data.artist as string | undefined) ||
        (fromResultArtist as string | undefined) ||
        "Unknown artist",
      album: (job.data.album as string | undefined) || "Unknown album",
      year: (job.data.year as string | number | undefined) || "",
      styles: [],
      genres: [],
      duration: "",
      duration_seconds: undefined,
      position: 0,
      discogs_url: (job.data.discogs_url as string | undefined) || "",
      apple_music_url: (job.data.apple_music_url as string | undefined) || "",
      youtube_url: job.data.youtube_url,
      spotify_url: job.data.spotify_url,
      soundcloud_url: job.data.soundcloud_url,
      album_thumbnail: job.data.album_thumbnail || "/images/placeholder-artwork.png",
      local_tags: "",
      bpm: undefined,
      key: undefined,
      danceability: undefined,
      mood_happy: undefined,
      mood_sad: undefined,
      mood_relaxed: undefined,
      mood_aggressive: undefined,
      notes: undefined,
      local_audio_url: job.data.local_audio_url,
      star_rating: undefined,
      username: job.data.username || undefined,
      _semanticScore: undefined,
      friend_id: job.data.friend_id,
      release_id: undefined,
      library_identifier: job.data.library_identifier || undefined,
    };
  };

  return (
    <Container maxW="6xl" p={[0,6]}>
      <Stack gap={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Job Queue Status</Heading>
          <Box display="flex" gap={2}>
            <Button
              onClick={() => clearJobsMutation.mutate()}
              loading={clearJobsMutation.isPending}
              variant="outline"
              colorScheme="red"
              disabled={summary.total === 0}
              aria-label="Clear all jobs"
              title="Clear All"
            >
              <LuTrash2 />
              <Text display={{ base: "none", md: "inline" }}>Clear All</Text>
            </Button>
            <Button
              onClick={() => refetch()}
              loading={isLoading}
              variant="outline"
              aria-label="Refresh jobs"
              title="Refresh"
            >
              <LuRefreshCw />
              <Text display={{ base: "none", md: "inline" }}>Refresh</Text>
            </Button>
          </Box>
        </Box>

        {dataUpdatedAt && (
          <Text fontSize="sm" color="gray.500">
            Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </Text>
        )}

        {/* Summary Cards */}
        <SimpleGrid columns={[2, 3, 5]} gap={{ base: 2, md: 4 }}>
          <Card.Root>
            <Card.Body textAlign="center" py={{ base: 3, md: 6 }}>
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
                {summary.total}
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                Total Jobs
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body textAlign="center" py={{ base: 3, md: 6 }}>
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="blue.500">
                {summary.waiting}
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                Waiting
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body textAlign="center" py={{ base: 3, md: 6 }}>
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="orange.500">
                {summary.active}
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                Active
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body textAlign="center" py={{ base: 3, md: 6 }}>
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="green.500">
                {summary.completed}
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                Completed
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body textAlign="center" py={{ base: 3, md: 6 }}>
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="red.500">
                {summary.failed}
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                Failed
              </Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Jobs List */}
        {isLoading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" />
            <Text mt={4}>Loading jobs...</Text>
          </Box>
        ) : jobs.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">No jobs found</Text>
          </Box>
        ) : (
          <VStack gap={3} align="stretch">
            {jobs.map((job) => {
              const downloaderInfo = getDownloaderInfo(job);
              return (
                <TrackResultStore
                  key={job.id}
                  trackId={job.data.track_id}
                  friendId={job.data.friend_id}
                  fallbackTrack={buildFallbackTrack(job)}
                  compact
                  fetchIfMissing
                  showUsername={false}
                  showRating={false}
                  showDetails={false}
                  showGenres={false}
                  showLinks={false}
                  showNotes={false}
                  showPlaylistCount={false}
                  footer={
                    <Stack gap={2} pt={1}>
                      <Flex gap={2} flexWrap="wrap" alignItems="center">
                        <Badge variant="outline">{job.queue}</Badge>
                        <Badge colorScheme={downloaderInfo.color} variant="solid" size="sm">
                          {downloaderInfo.name}
                        </Badge>
                        <Text fontSize="sm" color="gray.600">
                          {downloaderInfo.source}
                          {downloaderInfo.quality !== "unknown" ? ` • ${downloaderInfo.quality}` : ""}
                        </Text>
                        {getStateBadge(job.state)}
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setDetailsJob(job)}
                          aria-label="Job details"
                          title="Details"
                        >
                          <LuInfo />
                          <Text display={{ base: "none", md: "inline" }}>Details</Text>
                        </Button>
                      </Flex>

                      {job.state === "active" ? (
                        <Box>
                          <Progress.Root value={job.progress} size="sm" colorScheme="blue" mb={1}>
                            <Progress.Track>
                              <Progress.Range />
                            </Progress.Track>
                          </Progress.Root>
                          <Text fontSize="xs" color="gray.500">
                            {job.progress}%
                          </Text>
                        </Box>
                      ) : (
                        <Text fontSize="sm" color="gray.600">
                          Progress: {job.progress > 0 ? `${job.progress}%` : "-"}
                        </Text>
                      )}

                      <Flex gap={4} flexWrap="wrap" fontSize="sm" color="gray.600">
                        <Text>Attempts: {job.attemptsMade}</Text>
                        <Text>Duration: {formatDuration(job.processedOn, job.finishedOn)}</Text>
                        <Text>Finished: {formatTimestamp(job.finishedOn)}</Text>
                      </Flex>

                      {job.failedReason && (
                        <Text fontSize="sm" color="red.500">
                          {job.failedReason}
                        </Text>
                      )}
                    </Stack>
                  }
                />
              );
            })}
          </VStack>
        )}
        <Dialog.Root
          open={!!detailsJob}
          onOpenChange={(details) => {
            if (!details.open) setDetailsJob(null);
          }}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Job Details</Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body>
                  {detailsJob && (
                    <Stack gap={3}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Job ID</Text>
                        <Text fontFamily="mono">{detailsJob.id}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Track ID</Text>
                        <Text fontFamily="mono">{detailsJob.data.track_id}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Queue</Text>
                        <Text>{detailsJob.queue}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">State</Text>
                        <Text>{detailsJob.state}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Attempts</Text>
                        <Text>{detailsJob.attemptsMade}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Duration</Text>
                        <Text>{formatDuration(detailsJob.processedOn, detailsJob.finishedOn)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Finished</Text>
                        <Text>{formatTimestamp(detailsJob.finishedOn)}</Text>
                      </Box>
                      {detailsJob.failedReason && (
                        <Box>
                          <Text fontSize="sm" color="gray.500">Failure</Text>
                          <Text color="red.500">{detailsJob.failedReason}</Text>
                        </Box>
                      )}
                    </Stack>
                  )}
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Stack>
    </Container>
  );
}
