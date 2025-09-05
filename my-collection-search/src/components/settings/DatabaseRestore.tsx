import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  HStack,
  Button,
  FileUpload,
  CloseButton,
  Alert,
} from "@chakra-ui/react";
import { HiUpload } from "react-icons/hi";

const DatabaseRestore: React.FC = () => {
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    setRestoreResult(null);
    setRestoreError(null);
    try {
      const formData = new FormData();
      formData.append("file", restoreFile);
      const res = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setRestoreResult(data.message || "Restore complete");
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={2}>
        Restore Database from SQL File
      </Heading>
      <Text mb={2}>
        Upload a SQL backup file to restore your database. This will overwrite
        all current data.
      </Text>
      {restoreError && (
        <Alert.Root status="error" title="Error" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Restore Error</Alert.Title>
            <Alert.Description>{restoreError}</Alert.Description>
          </Alert.Content>
          <CloseButton
            pos="relative"
            top="-2"
            insetEnd="-2"
            onClick={() => setRestoreError(null)}
          />
        </Alert.Root>
      )}
      {restoreResult && (
        <Alert.Root status="success" title="Restore Complete" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Restore Complete</Alert.Title>
            <Alert.Description>{restoreResult}</Alert.Description>
          </Alert.Content>
          <CloseButton
            pos="relative"
            top="-2"
            insetEnd="-2"
            onClick={() => setRestoreResult(null)}
          />
        </Alert.Root>
      )}
      <HStack mb={4}>
        <FileUpload.Root
          accept=".sql"
          onChange={(event) => {
            const input = event.target as HTMLInputElement;
            const fileList = input.files;
            if (fileList && fileList[0]) setRestoreFile(fileList[0]);
          }}
          disabled={restoring}
        >
          <FileUpload.HiddenInput />
          <FileUpload.Trigger asChild>
            <Button variant="outline" size="sm">
              <HiUpload /> Upload file
            </Button>
          </FileUpload.Trigger>
          <FileUpload.List />
        </FileUpload.Root>
        <Button
          colorScheme="red"
          onClick={handleRestore}
          disabled={!restoreFile || restoring}
          loading={restoring}
        >
          Restore Database
        </Button>
      </HStack>
    </Box>
  );
};

export default DatabaseRestore;
