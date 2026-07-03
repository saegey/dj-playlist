"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Drawer,
  Flex,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FaPlay } from "react-icons/fa";
import { FiMoreVertical, FiTrash } from "react-icons/fi";

interface PlaylistItemActionsMenuProps {
  playlistName: string;
  onPlay: () => void;
  onDelete: () => void;
}

const menuDivider = (
  <Box
    as="hr"
    my={1}
    borderColor="gray.200"
    _dark={{ borderColor: "gray.700" }}
    borderWidth={0}
    borderTopWidth={1}
  />
);

const drawerDivider = (
  <Box
    as="hr"
    borderColor="gray.200"
    _dark={{ borderColor: "gray.700" }}
    borderWidth={0}
    borderTopWidth={1}
  />
);

function DrawerItem({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <Box as="button" onClick={onClick} w="full" textAlign="left" cursor="pointer">
      <Flex align="center" gap={4} px={5} py={3.5} w="full" color={color} _hover={{ bg: "bg.subtle" }}>
        <Box flexShrink={0} fontSize="md">{icon}</Box>
        <Text fontSize="md">{label}</Text>
      </Flex>
    </Box>
  );
}

export default function PlaylistItemActionsMenu({
  playlistName,
  onPlay,
  onDelete,
}: PlaylistItemActionsMenuProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const close = () => setDrawerOpen(false);

  return (
    <>
      {/* Mobile: bottom sheet */}
      <Box display={{ base: "block", md: "none" }}>
        <Button size="xs" variant="ghost" px={2} aria-label="Playlist actions" onClick={() => setDrawerOpen(true)}>
          <FiMoreVertical />
        </Button>
        <Drawer.Root placement="bottom" open={drawerOpen} onOpenChange={(d) => setDrawerOpen(d.open)}>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content borderTopRadius="xl">
                <Drawer.Header borderBottomWidth="1px" py={3} px={5} position="relative">
                  <Text fontWeight="semibold" fontSize="sm" lineClamp={1} pr={8}>
                    {playlistName}
                  </Text>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton size="sm" position="absolute" right={3} top="50%" transform="translateY(-50%)" />
                  </Drawer.CloseTrigger>
                </Drawer.Header>
                <Drawer.Body p={0}>
                  <Stack gap={0}>
                    <DrawerItem icon={<FaPlay />} label="Play Now" onClick={() => { onPlay(); close(); }} />
                    {drawerDivider}
                    <DrawerItem icon={<FiTrash />} label="Delete" color="red.500" onClick={() => { onDelete(); close(); }} />
                  </Stack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </Box>

      {/* Desktop: dropdown menu */}
      <Box display={{ base: "none", md: "block" }}>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button size="xs" variant="ghost" px={2} aria-label="Playlist actions">
              <FiMoreVertical />
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="play-now" onClick={onPlay}>
                <FaPlay /> Play now
              </Menu.Item>
              {menuDivider}
              <Menu.Item
                value="delete"
                onClick={onDelete}
                color="fg.error"
                _hover={{ bg: "bg.error", color: "fg.error" }}
              >
                <FiTrash /> Delete
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Box>
    </>
  );
}
