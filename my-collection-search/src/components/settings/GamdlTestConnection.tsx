"use client";

import React from "react";
import {
  Box,
  Card,
  Stack,
  Heading,
  Text,
  Button,
  Alert,
  VStack,
  HStack,
  List,
  Badge,
} from "@chakra-ui/react";
import { LuPlay, LuCheck, LuX, LuClock } from "react-icons/lu";
import { toaster } from "@/components/ui/toaster";
import { useMutation } from "@tanstack/react-query";

interface TestResult {
  success: boolean;
  message: string;
  details?: {
    gamdl_available: boolean;
    cookie_file_exists: boolean;
    cookie_file_valid: boolean;
    test_download_attempted?: boolean;
    test_download_success?: boolean;
    error_type?: string;
  };
}

async function testGamdlConnection(): Promise<TestResult> {
  const response = await fetch("/api/settings/gamdl/test", {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || "Test connection failed");
  }

  return response.json();
}

export default function GamdlTestConnection() {
  const [lastResult, setLastResult] = React.useState<TestResult | null>(null);

  const testMutation = useMutation({
    mutationFn: testGamdlConnection,
    onSuccess: (result) => {
      setLastResult(result);
      if (result.success) {
        toaster.create({
          title: "Connection Test Passed",
          description: result.message,
          type: "success",
        });
      } else {
        toaster.create({
          title: "Connection Test Failed",
          description: result.message,
          type: "error",
        });
      }
    },
    onError: (error) => {
      setLastResult({
        success: false,
        message: error.message,
      });
      toaster.create({
        title: "Test Failed",
        description: error.message,
        type: "error",
      });
    },
  });

  const handleTest = () => {
    testMutation.mutate();
  };

  const getStatusIcon = (status?: boolean) => {
    if (status === undefined) return <LuClock />;
    return status ? <LuCheck color="green" /> : <LuX color="red" />;
  };

  const getStatusColor = (status?: boolean) => {
    if (status === undefined) return "gray";
    return status ? "green" : "red";
  };

  return (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between">
          <Box>
            <Heading size="md">Test Gamdl Connection</Heading>
            <Text color="gray.500" fontSize="sm">
              Verify that gamdl is properly configured and working
            </Text>
          </Box>
          <Button
            onClick={handleTest}
            loading={testMutation.isPending}
            colorScheme="blue"
            variant="outline"
          >
            <LuPlay />
            Test Connection
          </Button>
        </HStack>
      </Card.Header>

      <Card.Body>
        <Stack gap={4}>
          {/* Test Results */}
          {lastResult && (
            <Alert.Root status={lastResult.success ? "success" : "error"}>
              <VStack align="start" gap={2}>
                <Text fontWeight="medium">{lastResult.message}</Text>

                {/* Detailed Results */}
                {lastResult.details && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Test Details:</Text>
                    <List.Root>
                      <List.Item>
                        <HStack>
                          {getStatusIcon(lastResult.details.gamdl_available)}
                          <Text>Gamdl executable available</Text>
                          <Badge colorScheme={getStatusColor(lastResult.details.gamdl_available)} variant="subtle">
                            {lastResult.details.gamdl_available ? "Found" : "Missing"}
                          </Badge>
                        </HStack>
                      </List.Item>

                      <List.Item>
                        <HStack>
                          {getStatusIcon(lastResult.details.cookie_file_exists)}
                          <Text>Cookie file exists</Text>
                          <Badge colorScheme={getStatusColor(lastResult.details.cookie_file_exists)} variant="subtle">
                            {lastResult.details.cookie_file_exists ? "Found" : "Missing"}
                          </Badge>
                        </HStack>
                      </List.Item>

                      {lastResult.details.cookie_file_exists && (
                        <List.Item>
                          <HStack>
                            {getStatusIcon(lastResult.details.cookie_file_valid)}
                            <Text>Cookie file valid</Text>
                            <Badge colorScheme={getStatusColor(lastResult.details.cookie_file_valid)} variant="subtle">
                              {lastResult.details.cookie_file_valid ? "Valid" : "Invalid"}
                            </Badge>
                          </HStack>
                        </List.Item>
                      )}

                      {lastResult.details.test_download_attempted && (
                        <List.Item>
                          <HStack>
                            {getStatusIcon(lastResult.details.test_download_success)}
                            <Text>Test download</Text>
                            <Badge colorScheme={getStatusColor(lastResult.details.test_download_success)} variant="subtle">
                              {lastResult.details.test_download_success ? "Success" : "Failed"}
                            </Badge>
                          </HStack>
                        </List.Item>
                      )}
                    </List.Root>

                    {lastResult.details.error_type && (
                      <Text fontSize="sm" color="red.500" mt={2}>
                        <strong>Error Type:</strong> {lastResult.details.error_type}
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            </Alert.Root>
          )}

          {/* Information */}
          <Alert.Root status="info">
            <VStack align="start" gap={1}>
              <Text fontWeight="medium">What this test checks:</Text>
              <List.Root>
                <List.Item>• Gamdl is installed and accessible</List.Item>
                <List.Item>• Cookie file exists and contains Apple Music cookies</List.Item>
                <List.Item>• Cookie file is properly formatted</List.Item>
                <List.Item>• Test authentication with Apple Music (optional)</List.Item>
              </List.Root>
            </VStack>
          </Alert.Root>

          {!lastResult && (
            <Box textAlign="center" py={4}>
              <Text color="gray.500">
                Click &quot;Test Connection&quot; to verify your gamdl setup
              </Text>
            </Box>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}