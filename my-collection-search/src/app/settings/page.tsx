// app/(pages)/settings/page.tsx
"use client";
import { useMemo, useState } from "react";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";

import { SettingsDialogsProvider } from "@/providers/SettingsDialogProvider";
import { SyncStreamsProvider } from "@/providers/SyncStreamsProvider";
import ActionsGrid from "@/components/settings/ActionsGrid";
import FriendsDiscogsSection from "@/components/settings/FriendsDiscogsSection";
import DatabaseBackups from "@/components/settings/DatabaseBackups";
import DatabaseRestore from "@/components/settings/DatabaseRestore";
import BackupPolicySettingsSection from "@/components/settings/BackupPolicySettingsSection";
import GamdlSettingsSection from "@/components/settings/GamdlSettingsSection";
import AiPromptSettingsSection from "@/components/settings/AiPromptSettingsSection";
import EmbeddingPromptSettingsSection from "@/components/settings/EmbeddingPromptSettingsSection";
import PageContainer from "@/components/layout/PageContainer";
import DiscogsSyncDialog from "@/components/settings/dialogs/DiscogsSyncDialog";
import RemoveFriendDialog from "@/components/settings/dialogs/RemoveFriendDialog"; // your streamed removal dialog

type SettingsSection = {
  id: string;
  label: string;
  description: string;
  content: React.ReactNode;
};

export default function SettingsPage() {
  const sections: SettingsSection[] = useMemo(
    () => [
      {
        id: "downloads",
        label: "Downloads",
        description: "gamdl, cookies, and download connectivity",
        content: <GamdlSettingsSection />,
      },
      {
        id: "ai",
        label: "AI Metadata",
        description: "metadata prompt and embedding template",
        content: (
          <>
            <AiPromptSettingsSection />
            <EmbeddingPromptSettingsSection />
          </>
        ),
      },
      {
        id: "library",
        label: "Library Data",
        description: "friends and Discogs import settings",
        content: <FriendsDiscogsSection />,
      },
      {
        id: "disaster-recovery",
        label: "Disaster Recovery",
        description: "remote policy, local backups, and restore",
        content: (
          <>
            <BackupPolicySettingsSection />
            <DatabaseBackups />
            <DatabaseRestore />
          </>
        ),
      },
    ],
    []
  );

  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "downloads");
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];

  return (
    <SettingsDialogsProvider>
      <SyncStreamsProvider>
        <PageContainer size="wide">
          <Box mb="120px">
            <Flex
              align={{ base: "start", md: "center" }}
              justify="space-between"
              gap={4}
              mb={6}
              direction={{ base: "column", md: "row" }}
            >
              <Box>
                <Heading size="xl" mb={1}>
                  Settings
                </Heading>
                <Text color="gray.600">
                  Configure GrooveNET by area, without the long one-page scroll.
                </Text>
              </Box>
              <Box minW={{ md: "220px" }}>
                <ActionsGrid showTitle={false} />
              </Box>
            </Flex>

            <Box display={{ base: "block", md: "none" }} mb={4}>
              <Text fontSize="sm" color="gray.500" mb={2}>
                Section
              </Text>
              <select
                value={activeSectionId}
                onChange={(e) => setActiveSectionId(e.target.value)}
                style={{
                  width: "100%",
                  height: "var(--chakra-sizes-10)",
                  padding: "0 var(--chakra-spacing-3)",
                  borderRadius: "var(--chakra-radii-md)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--chakra-colors-border)",
                  backgroundColor: "var(--chakra-colors-bg)",
                  color: "inherit",
                }}
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </Box>

            <Flex gap={6} align="start">
              <Box
                display={{ base: "none", md: "block" }}
                w="260px"
                flexShrink={0}
                position="sticky"
                top="20px"
              >
                <Box borderWidth={1} borderRadius="lg" p={3}>
                  {sections.map((section) => {
                    const isActive = section.id === activeSectionId;
                    return (
                      <Button
                        key={section.id}
                        variant={isActive ? "solid" : "ghost"}
                        colorScheme={isActive ? "blue" : undefined}
                        justifyContent="start"
                        h="auto"
                        py={3}
                        px={3}
                        mb={2}
                        w="full"
                        onClick={() => setActiveSectionId(section.id)}
                      >
                        <Box textAlign="left">
                          <Text fontWeight="semibold">{section.label}</Text>
                          <Text fontSize="xs" color={isActive ? "blue.100" : "gray.500"}>
                            {section.description}
                          </Text>
                        </Box>
                      </Button>
                    );
                  })}
                </Box>
              </Box>

              <Box
                flex={1}
                minW={0}
                borderWidth={1}
                borderRadius="lg"
                p={{ base: 4, md: 6 }}
                bg="bg"
              >
                <Heading size="lg" mb={1}>
                  {activeSection.label}
                </Heading>
                <Text color="gray.500" mb={4}>
                  {activeSection.description}
                </Text>
                {activeSection.content}
              </Box>
            </Flex>
          </Box>
        </PageContainer>

        {/* dialogs */}
        <DiscogsSyncDialog />
        <RemoveFriendDialog />
      </SyncStreamsProvider>
    </SettingsDialogsProvider>
  );
}
