"use client";

import { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  HStack,
  Collapse,
  useColorModeValue,
  Divider,
  Code,
} from '@chakra-ui/react';


type SyncResult = {
  message?: string;
  newReleases: string[];
  alreadyHave: string[];
  total?: number;
  totalCollection?: number;
  newCount?: number;
  errors?: { releaseId: string; error: string }[];
};
type IndexResult = { message?: string };

export default function DiscogsSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/discogs', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  const handleUpdateIndex = async () => {
    setIndexing(true);
    setIndexResult(null);
    setIndexError(null);
    try {
      const res = await fetch('/api/discogs/update-index', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setIndexResult(data);
    } catch (e) {
      setIndexError(e instanceof Error ? e.message : String(e));
    } finally {
      setIndexing(false);
    }
  };

  const [backingUp, setBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const handleBackup = async () => {
    setBackingUp(true);
    setBackupResult(null);
    setBackupError(null);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setBackupResult(data.message || 'Backup complete');
    } catch (e) {
      setBackupError(e instanceof Error ? e.message : String(e));
    } finally {
      setBackingUp(false);
    }
  };

  // Chakra UI color mode value must be called unconditionally
  const cardBg = useColorModeValue('gray.50', 'gray.800');

  return (
    <Box maxW="700px" mx="auto" p={8}>
      <Heading mb={6} size="lg">Discogs Collection Sync</Heading>
      <HStack spacing={4} mb={6}>
        <Button
          colorScheme="blue"
          onClick={handleSync}
          isLoading={syncing}
          isDisabled={syncing || indexing}
        >
          Sync Now
        </Button>
        <Button
          colorScheme="purple"
          onClick={handleUpdateIndex}
          isLoading={indexing}
          isDisabled={indexing || syncing}
        >
          Update Index
        </Button>
        <Button
          colorScheme="orange"
          onClick={handleBackup}
          isLoading={backingUp}
          isDisabled={backingUp || syncing || indexing}
        >
          Backup Database
        </Button>
      </HStack>

      {indexError && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle mr={2}>Index Error:</AlertTitle>
          <AlertDescription>{indexError}</AlertDescription>
        </Alert>
      )}

      {indexResult && (
        <Box mt={6} p={4} borderWidth={1} borderRadius="md" bg={cardBg}>
          <Heading size="md" mb={2}>Index Update Results</Heading>
          <Text>{indexResult.message}</Text>
        </Box>
      )}

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle mr={2}>Error:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Box mt={6} p={4} borderWidth={1} borderRadius="md" bg={cardBg}>
          <Heading size="md" mb={2}>Sync Results</Heading>
          <VStack align="start" spacing={2}>
            <Text><b>New releases downloaded:</b> {result.newReleases.length}</Text>
            <Text><b>Already present:</b> {result.alreadyHave.length}</Text>
            <Text><b>Total releases processed:</b> {result.total || result.totalCollection || (result.newReleases.length + result.alreadyHave.length)}</Text>
          </VStack>
          {result.errors && result.errors.length > 0 && (
            <Box color="orange.600" mt={4}>
              <b>Errors:</b>
              <VStack align="start" spacing={1} mt={1}>
                {result.errors.map((e: { releaseId: string; error: string }, i: number) => (
                  <Text key={i} fontSize="sm">Release {e.releaseId}: {e.error}</Text>
                ))}
              </VStack>
            </Box>
          )}
          {result.newReleases.length > 0 && (
            <Collapse in={true} animateOpacity>
              <Box mt={4}>
                <Divider mb={2} />
                <details>
                  <summary>Show new release IDs</summary>
                  <Code display="block" whiteSpace="pre" p={2} mt={2} fontSize="sm">
                    {JSON.stringify(result.newReleases, null, 2)}
                  </Code>
                </details>
              </Box>
            </Collapse>
          )}
        </Box>
      )}

      {backupError && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle mr={2}>Backup Error:</AlertTitle>
          <AlertDescription>{backupError}</AlertDescription>
        </Alert>
      )}
      {backupResult && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          <AlertTitle mr={2}>Backup Complete:</AlertTitle>
          <AlertDescription>{backupResult}</AlertDescription>
        </Alert>
      )}
    </Box>
  );
}
