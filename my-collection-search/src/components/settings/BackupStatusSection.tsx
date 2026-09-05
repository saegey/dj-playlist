"use client";

import React from "react";
import { Badge, Box, Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import {
  fetchBackupStatus,
  runBackupNow,
  type BackupStatus,
} from "@/services/internalApi/settings";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function statusColor(status: BackupStatus["status"]): string {
  if (status === "success") return "green";
  if (status === "failed") return "red";
  return "orange";
}

export default function BackupStatusSection(): React.JSX.Element {
  const [status, setStatus] = React.useState<BackupStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBackupStatus();
      setStatus(data.status);
    } catch (err) {
      toaster.create({
        title: "Failed to load backup status",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const runNow = async () => {
    setRunning(true);
    try {
      const data = await runBackupNow();
      setStatus(data.status);
      toaster.create({
        title:
          data.status?.status === "success"
            ? "Remote backup completed"
            : "Remote backup finished",
        description: data.status
          ? `Status: ${data.status.status} (${data.status.reason})`
          : "Backup run completed without a persisted status record.",
        type: data.status?.status === "failed" ? "error" : "success",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to run remote backup",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setRunning(false);
      void load();
    }
  };

  return (
    <Box mt={{ base: 4, md: 8 }} p={{ base: 4, md: 4 }} borderWidth={1} borderRadius="md">
      <Flex justify="space-between" align="start" gap={3} mb={2}>
        <Box>
          <Heading size="md" mb={2}>
            Remote Backup Status
          </Heading>
          <Text color="gray.600">
            Persists the last backup run result and the most recent snapshot summary.
          </Text>
        </Box>
        <Flex gap={2}>
          <Button colorScheme="blue" size="sm" onClick={runNow} loading={running}>
            Run Remote Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            loading={loading}
            disabled={running}
          >
            Reload
          </Button>
        </Flex>
      </Flex>

      {loading ? (
        <Spinner size="sm" />
      ) : !status ? (
        <Text color="gray.600">No remote backup status has been recorded yet.</Text>
      ) : (
        <Flex direction="column" gap={3}>
          <Flex align="center" gap={2} wrap="wrap">
            <Badge colorPalette={statusColor(status.status)}>{status.status}</Badge>
            <Text fontSize="sm" color="gray.600">
              Reason: {status.reason}
            </Text>
          </Flex>

          <Text fontSize="sm">
            Last attempt: {formatTimestamp(status.finished_at)}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Recorded: {formatTimestamp(status.stored_at)}
          </Text>

          {status.error ? (
            <Text fontSize="sm" color="red.500">
              Error: {status.error}
            </Text>
          ) : null}

          {status.missing_env?.length ? (
            <Text fontSize="sm" color="red.500">
              Missing env: {status.missing_env.join(", ")}
            </Text>
          ) : null}

          <Box>
            <Text fontWeight="semibold" mb={1}>
              Included Paths
            </Text>
            {status.backed_up_paths.length === 0 ? (
              <Text fontSize="sm" color="gray.600">
                No paths were backed up in the last run.
              </Text>
            ) : (
              <Flex direction="column" gap={1}>
                {status.backed_up_paths.map((value) => (
                  <Text key={value} fontSize="sm" fontFamily="mono">
                    {value}
                  </Text>
                ))}
              </Flex>
            )}
          </Box>

          <Box>
            <Text fontWeight="semibold" mb={1}>
              Latest Snapshot
            </Text>
            {!status.snapshot ? (
              <Text fontSize="sm" color="gray.600">
                No snapshot summary is available yet.
              </Text>
            ) : (
              <Flex direction="column" gap={1}>
                <Text fontSize="sm">ID: {status.snapshot.short_id ?? status.snapshot.id}</Text>
                <Text fontSize="sm">Time: {formatTimestamp(status.snapshot.time)}</Text>
                {status.snapshot.hostname ? (
                  <Text fontSize="sm">Host: {status.snapshot.hostname}</Text>
                ) : null}
                {status.snapshot.tags.length ? (
                  <Text fontSize="sm">Tags: {status.snapshot.tags.join(", ")}</Text>
                ) : null}
              </Flex>
            )}
          </Box>
        </Flex>
      )}
    </Box>
  );
}
