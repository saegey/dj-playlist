"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Container,
  Flex,
  HStack,
  Link,
  Text,
  IconButton,
  VStack,
  Drawer,
  Icon,
  Portal,
} from "@chakra-ui/react";
import { TbPlaylist } from "react-icons/tb";
import { SiApplemusic } from "react-icons/si";
import { LuAudioLines } from "react-icons/lu";
import { IoBookSharp, IoMusicalNotes, IoSettings } from "react-icons/io5";
import { FiMenu } from "react-icons/fi";
import { usePlaylistDrawer } from "@/providers/PlaylistDrawer";

interface TopMenuBarProps {
  current?: string;
}

const menuItems = [
  { href: "/", label: "Library" },
  { href: "/playlists", label: "Playlists" },
  { href: "/missing-apple-music", label: "Match" },
  { href: "/backfill-audio", label: "Audio" },
  { href: "/bulk-notes", label: "Metadata" },
  { href: "/settings", label: "Settings" },
];

export default function TopMenuBar({ current }: TopMenuBarProps) {
  const [open, setOpen] = useState(false);
  const { isOpen: isPlaylistDrawerOpen, setOpen: setPlaylistDrawerOpen } =
    usePlaylistDrawer();

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={80}
      bg="bg"
      // backdropFilter="saturate(180%) blur(12px)"
      borderBottomWidth="1px"
      borderColor="brand.0"
    >
      <Container maxW={"full"}>
        <Flex h={14} align="center" justify="space-between" gap={3}>
          <HStack gap={2} align="center">
            <IconButton
              aria-label="Open menu"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              <FiMenu size={'16px'} />
            </IconButton>
            <Text fontWeight="semibold">GrooveNet</Text>
          </HStack>

          {/* Optional inline nav on larger screens */}
          {/* <HStack hideBelow="lg" gap={3} color="brand.menuText">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                as={NextLink}
                href={item.href}
                _hover={{ textDecoration: "none", color: "brand.menuHover" }}
                fontWeight={current === item.href ? "bold" : "normal"}
                color={
                  current === item.href ? "brand.menuActiveText" : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </HStack> */}
        </Flex>
      </Container>

      {/* Side menu drawer (left) */}
      <Portal>
        <Drawer.Root
          open={open}
          onOpenChange={(e) => setOpen(e.open)}
          size={["xs", "xs", "sm"]}
          placement="start"
        >
          {/* <Drawer.Backdrop /> */}
          <Drawer.Positioner paddingTop="57px" paddingBottom={[0, "117px"]}>
            <Drawer.Content
              boxShadow="none"
              borderRightStyle="solid"
              borderRightWidth={"1px"}
              borderRightColor={"brand.0"}
              // borderBottomStyle="solid"
              // borderBottomWidth={[0, "1px"]}
              // borderBottomColor={"brand.0"}
            >
              <Drawer.Body>
                <VStack align="stretch" gap={1}>
                  {menuItems.map((item) => {
                    const active = current === item.href;
                    const icon =
                      item.href === "/"
                        ? IoMusicalNotes
                        : item.href === "/missing-apple-music"
                        ? SiApplemusic
                        : item.href === "/backfill-audio"
                        ? LuAudioLines
                        : item.href === "/bulk-notes"
                        ? IoBookSharp
                        : item.href === "/settings"
                        ? IoSettings
                        : item.href === "/playlists"
                        ? TbPlaylist
                        : IoBookSharp;

                    const ItemIcon = icon;
                    return (
                      <Link
                        key={item.href}
                        as={NextLink}
                        href={item.href}
                        onClick={() => {
                          setOpen(false);
                          if (isPlaylistDrawerOpen) {
                            setPlaylistDrawerOpen(false);
                          }
                        }}
                        _hover={{ textDecoration: "none", bg: "bg.subtle" }}
                        px={3}
                        py={2}
                        borderRadius="md"
                        bg={active ? "bg.subtle" : undefined}
                      >
                        <HStack gap={3} align="center">
                          <Icon
                            as={ItemIcon}
                            boxSize={5}
                            color={active ? "blue.500" : "fg.muted"}
                          />
                          <Text fontWeight={active ? "bold" : "normal"}>
                            {item.label}
                          </Text>
                        </HStack>
                      </Link>
                    );
                  })}
                </VStack>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>
      </Portal>
    </Box>
  );
}
