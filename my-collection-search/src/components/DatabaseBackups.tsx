import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Skeleton,
} from "@chakra-ui/react";
import { FiDownload } from "react-icons/fi";

export default function DatabaseBackups() {
  const [backups, setBackups] = useState<string[]>([]);
  const [showAllBackups, setShowAllBackups] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [backupListError, setBackupListError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    const fetchBackups = async () => {
      setLoadingBackups(true);
      setBackupListError(null);
      try {
        const res = await fetch("/api/backups");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unknown error");
        setBackups(
          data.files.filter(
            (file: string) => file !== "restore.sql" && file !== "clean.sql"
          ) || []
        );
      } catch (e) {
        setBackupListError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoadingBackups(false);
      }
    };
    fetchBackups();
  }, []);

  return (
    <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={2}>
        Database Backups
      </Heading>
      {initialLoad || loadingBackups ? (
        <VStack align="stretch" gap={3}>
          {[...Array(5)].map((_, i) => (
            <HStack key={i} justify="space-between">
              <Skeleton height="20px" width="60%" />
              <Skeleton height="28px" width="40px" />
            </HStack>
          ))}
        </VStack>
      ) : backupListError ? (
        <Box color="red.500" mb={2}>
          <b>Error:</b> {backupListError}
        </Box>
      ) : backups.length === 0 ? (
        <Text>No backups found in the directory.</Text>
      ) : (
        <>
          <VStack align="stretch" gap={3}>
            {(showAllBackups ? backups : backups.slice(0, 5)).map((file) => (
              <HStack key={file} justify="space-between">
                <Text fontSize="sm">{file}</Text>
                <a
                  href={`/api/backups/${encodeURIComponent(file)}`}
                  download
                  style={{ textDecoration: "none" }}
                >
                  <Button colorScheme="blue" size="xs">
                    <FiDownload />
                  </Button>
                </a>
              </HStack>
            ))}
          </VStack>
          {backups.length > 5 && (
            <Button
              mt={3}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              onClick={() => setShowAllBackups((v) => !v)}
              alignSelf="flex-start"
            >
              {showAllBackups ? "Show Less" : `Show All (${backups.length})`}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
