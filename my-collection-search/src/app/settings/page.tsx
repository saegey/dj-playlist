// app/(pages)/settings/page.tsx
"use client";
import { Box } from "@chakra-ui/react";

import { SettingsDialogsProvider } from "@/providers/SettingsDialogProvider";
import { SyncStreamsProvider } from "@/providers/SyncStreamsProvider";
import ActionsGrid from "@/components/settings/ActionsGrid";
import FriendsDiscogsSection from "@/components/settings/FriendsDiscogsSection";
import DatabaseBackups from "@/components/settings/DatabaseBackups";
import DatabaseRestore from "@/components/settings/DatabaseRestore";
import GamdlSettingsSection from "@/components/settings/GamdlSettingsSection";
import AiPromptSettingsSection from "@/components/settings/AiPromptSettingsSection";
import EmbeddingPromptSettingsSection from "@/components/settings/EmbeddingPromptSettingsSection";
import PageContainer from "@/components/layout/PageContainer";
import DiscogsSyncDialog from "@/components/settings/dialogs/DiscogsSyncDialog";
import SpotifySyncDialog from "@/components/settings/dialogs/SpotifySyncDialog";
import RemoveFriendDialog from "@/components/settings/dialogs/RemoveFriendDialog"; // your streamed removal dialog

export default function SettingsPage() {
  return (
    <SettingsDialogsProvider>
      <SyncStreamsProvider>
        <PageContainer size="narrow">
          <Box mb="120px">
            <ActionsGrid />
            <GamdlSettingsSection />
            <AiPromptSettingsSection />
            <EmbeddingPromptSettingsSection />
            <FriendsDiscogsSection />
            <DatabaseBackups />
            <DatabaseRestore />
          </Box>
        </PageContainer>

        {/* dialogs */}
        <DiscogsSyncDialog />
        <SpotifySyncDialog />
        <RemoveFriendDialog />
      </SyncStreamsProvider>
    </SettingsDialogsProvider>
  );
}
