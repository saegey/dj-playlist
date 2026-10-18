// components/settings/ActionsGrid.tsx
"use client";
import { Button, Flex, Menu, Text, Box } from "@chakra-ui/react";
import { FiBriefcase, FiMoreVertical } from "react-icons/fi";
import { toaster } from "@/components/ui/toaster";
import { useBackupsQuery } from "@/hooks/useBackupsQuery";

type ActionsGridProps = {
  showTitle?: boolean;
};

export default function ActionsGrid({ showTitle = true }: ActionsGridProps) {
  const { addBackup, addBackupLoading } = useBackupsQuery();

  const disableAll = addBackupLoading;

  return (
    <Box mb={4}>
      <Flex align="center" justify="space-between" mb={4}>
        {showTitle ? (
          <Text fontWeight="bold" fontSize="lg">
            Settings
          </Text>
        ) : (
          <Box />
        )}
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button size="sm" variant="outline" disabled={disableAll}>
              <FiMoreVertical />
              <Box ml={2} display={{ base: "none", md: "block" }}>
                Actions
              </Box>
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item
                value="backup"
                onClick={() =>
                  addBackup.mutate(undefined, {
                    onSuccess: (res) =>
                      toaster.create({
                        title: "Backup Complete",
                        type: "success",
                        description: res.message,
                      }),
                    onError: (e) =>
                      toaster.create({
                        title: "Backup Failed",
                        type: "error",
                        description: e.message,
                      }),
                  })
                }
                disabled={disableAll || addBackup.isPending}
              >
                <FiBriefcase /> Backup Database
              </Menu.Item>

              <Menu.Separator />
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Flex>

    </Box>
  );
}
