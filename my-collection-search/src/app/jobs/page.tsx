"use client";

import React from "react";
import {
  Container,
  Heading,
  Table,
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
} from "@chakra-ui/react";
import { LuRefreshCw, LuTrash2 } from "react-icons/lu";
import { useJobsQuery } from "@/hooks/useJobsQuery";
import { useMutation } from "@tanstack/react-query";
import { clearAllJobs } from "@/services/jobsService";

export default function JobsPage() {
  const { data, isLoading, refetch, dataUpdatedAt } = useJobsQuery();

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

  return (
    <Container maxW="6xl" py={6}>
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
            >
              <LuTrash2 /> Clear All
            </Button>
            <Button
              onClick={() => refetch()}
              loading={isLoading}
              variant="outline"
            >
              <LuRefreshCw /> Refresh
            </Button>
          </Box>
        </Box>

        {dataUpdatedAt && (
          <Text fontSize="sm" color="gray.500">
            Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </Text>
        )}

        {/* Summary Cards */}
        <SimpleGrid columns={[2, 3, 5]} gap={4}>
          <Card.Root>
            <Card.Body textAlign="center">
              <Text fontSize="2xl" fontWeight="bold">
                {summary.total}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Total Jobs
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {summary.waiting}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Waiting
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {summary.active}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Active
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {summary.completed}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Completed
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                {summary.failed}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Failed
              </Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Jobs Table */}
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
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Job ID</Table.ColumnHeader>
                <Table.ColumnHeader>Track ID</Table.ColumnHeader>
                <Table.ColumnHeader>Queue</Table.ColumnHeader>
                <Table.ColumnHeader>Downloader</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Progress</Table.ColumnHeader>
                <Table.ColumnHeader>Duration</Table.ColumnHeader>
                <Table.ColumnHeader>Attempts</Table.ColumnHeader>
                <Table.ColumnHeader>Finished</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {jobs.map((job) => (
                <Table.Row key={job.id}>
                  <Table.Cell>
                    <Text
                      fontFamily="mono"
                      fontSize="sm"
                      color="blue.500"
                      cursor="pointer"
                      textDecoration="underline"
                      onClick={() => {
                        console.log(`Job ${job.id} details:`, job);
                        // You can also open a modal or navigate to a detail page here
                      }}
                    >
                      {job.id}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontFamily="mono" fontSize="sm">
                      {job.data.track_id}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline">{job.queue}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {(() => {
                      const downloaderInfo = getDownloaderInfo(job);
                      return (
                        <VStack align="start" gap={1}>
                          <HStack gap={1}>
                            <Badge colorScheme={downloaderInfo.color} variant="solid" size="sm">
                              {downloaderInfo.name}
                            </Badge>
                            <Text fontSize="xs" color="gray.500">
                              {downloaderInfo.source}
                            </Text>
                          </HStack>
                          {downloaderInfo.quality !== "unknown" && (
                            <Text fontSize="xs" color="gray.400">
                              {downloaderInfo.quality}
                            </Text>
                          )}
                        </VStack>
                      );
                    })()}
                  </Table.Cell>
                  <Table.Cell>
                    <Box>
                      {getStateBadge(job.state)}
                      {job.failedReason && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                          {job.failedReason.substring(0, 50)}...
                        </Text>
                      )}
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    {job.state === "active" ? (
                      <Box>
                        <Progress.Root
                          value={job.progress}
                          size="sm"
                          colorScheme="blue"
                          mb={1}
                        >
                          <Progress.Track>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>
                        <Text fontSize="xs" color="gray.500">
                          {job.progress}%
                        </Text>
                      </Box>
                    ) : (
                      <Text fontSize="sm">
                        {job.progress > 0 ? `${job.progress}%` : "-"}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">
                      {formatDuration(job.processedOn, job.finishedOn)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">{job.attemptsMade}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">{formatTimestamp(job.finishedOn)}</Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Stack>
    </Container>
  );
}
