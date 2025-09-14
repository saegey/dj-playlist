// app/(pages)/settings/page.tsx
"use client";
import { Box } from "@chakra-ui/react";

import { SettingsDialogsProvider } from "@/providers/SettingsDialogProvider";
import { SyncStreamsProvider } from "@/providers/SyncStreamsProvider";
import ActionsGrid from "@/components/settings/ActionsGrid";
import FriendsDiscogsSection from "@/components/settings/FriendsDiscogsSection";
import DatabaseBackups from "@/components/settings/DatabaseBackups";
import DatabaseRestore from "@/components/settings/DatabaseRestore";
import DiscogsSyncDialog from "@/components/settings/dialogs/DiscogsSyncDialog";
import SpotifySyncDialog from "@/components/settings/dialogs/SpotifySyncDialog";
import RemoveFriendDialog from "@/components/settings/dialogs/RemoveFriendDialog"; // your streamed removal dialog

export default function SettingsPage() {
  return (
    <SettingsDialogsProvider>
      <SyncStreamsProvider>
        <Box maxW="700px" mx="auto" p={["12px", 8]} mb={"120px"}>
          <ActionsGrid />
          <FriendsDiscogsSection />
          <DatabaseBackups />
          <DatabaseRestore />
        </Box>

        {/* dialogs */}
        <DiscogsSyncDialog />
        <SpotifySyncDialog />
        <RemoveFriendDialog />
      </SyncStreamsProvider>
    </SettingsDialogsProvider>
  );
}
