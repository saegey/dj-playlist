import { useState } from "react";
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
import { useBackupsQuery } from "@/hooks/useBackupsQuery";

export default function DatabaseBackups() {
  const { backups, backupsLoading } = useBackupsQuery();
  const [showAllBackups, setShowAllBackups] = useState(false);

  return (
    <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={2}>
        Database Backups
      </Heading>
      {backupsLoading ? (
        <VStack align="stretch" gap={3}>
          {[...Array(5)].map((_, i) => (
            <HStack key={i} justify="space-between">
              <Skeleton height="20px" width="60%" />
              <Skeleton height="28px" width="40px" />
            </HStack>
          ))}
        </VStack>
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
