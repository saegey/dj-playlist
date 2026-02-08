"use client";

import React, { useMemo, useState } from "react";
import NextLink from "next/link";
import {
  Box,
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
import { Tooltip } from "@/components/ui/tooltip";
import { FiMenu, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { TbPlaylist } from "react-icons/tb";
import { SiApplemusic } from "react-icons/si";
import { LuAudioLines, LuCloudDownload } from "react-icons/lu";
import {
  IoBookSharp,
  IoMusicalNotes,
  IoSettings,
  IoAlbums,
  IoAddCircle,
} from "react-icons/io5";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/", label: "Tracks" },
  { href: "/albums", label: "Albums" },
  { href: "/albums/add", label: "Add Album" },
  { href: "/playlists", label: "Playlists" },
  { href: "/missing-apple-music", label: "Match" },
  { href: "/backfill-audio", label: "Audio" },
  { href: "/bulk-notes", label: "Metadata" },
  { href: "/jobs", label: "Jobs" },
  { href: "/settings", label: "Settings" },
];

function getItemIcon(href: string) {
  if (href === "/") return IoMusicalNotes;
  if (href === "/albums/add") return IoAddCircle;
  if (href === "/albums") return IoAlbums;
  if (href === "/tracks") return IoAlbums;
  if (href === "/missing-apple-music") return SiApplemusic;
  if (href === "/backfill-audio") return LuAudioLines;
  if (href === "/bulk-notes") return IoBookSharp;
  if (href === "/settings") return IoSettings;
  if (href === "/playlists") return TbPlaylist;
  if (href === "/jobs") return LuCloudDownload;
  return IoBookSharp;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = useMemo(() => {
    if (!pathname) return "";
    if (pathname === "/") return "/";
    return pathname.split("?")[0];
  }, [pathname]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Flex minH="100vh" bg="bg">
      {/* Desktop sidebar */}
      <Box
        display={{ base: "none", md: "block" }}
        position="sticky"
        top={0}
        h="100vh"
        w={isExpanded ? "220px" : "64px"}
        transition="width 0.18s ease"
        borderRightWidth="1px"
        borderColor="brand.0"
        bg="bg"
      >
        <Flex direction="column" h="100%" py={3} gap={2}>
          <Flex
            px={isExpanded ? 3 : 2}
            align="center"
            justify="space-between"
            gap={2}
          >
            <HStack gap={2} align="center">
              <Box w="8px" h="8px" bg="blue.500" borderRadius="full" />
              {isExpanded && (
                <Text fontWeight="semibold" letterSpacing="0.02em">
                  GrooveNet
                </Text>
              )}
            </HStack>

            <Tooltip
              content={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              disabled={false}
              openDelay={250}
            >
              <IconButton
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                size="xs"
                variant="outline"
                minW="auto"
                px={1}
                onClick={() => setIsExpanded((v) => !v)}
              >
                {isExpanded ? <FiChevronLeft /> : <FiChevronRight />}
              </IconButton>
            </Tooltip>
          </Flex>

          <VStack align="stretch" gap={1} mt={2} px={isExpanded ? 2 : 1}>
            {menuItems.map((item) => {
              const active = current === item.href;
              const ItemIcon = getItemIcon(item.href);
              return (
                <Tooltip
                  key={item.href}
                  content={item.label}
                  disabled={isExpanded}
                  openDelay={250}
                >
                  <Link
                    as={NextLink}
                    href={item.href}
                    _hover={{ textDecoration: "none", bg: "bg.subtle" }}
                    px={isExpanded ? 3 : 2}
                    py={2}
                    borderRadius="md"
                    bg={active ? "bg.subtle" : undefined}
                    title={item.label}
                  >
                    <HStack gap={3} align="center">
                      <Icon
                        as={ItemIcon}
                        boxSize={5}
                        color={active ? "blue.500" : "fg.muted"}
                      />
                      {isExpanded && (
                        <Text fontWeight={active ? "bold" : "normal"}>
                          {item.label}
                        </Text>
                      )}
                    </HStack>
                  </Link>
                </Tooltip>
              );
            })}
          </VStack>

          <Box mt="auto" px={isExpanded ? 2 : 1} pb={2} />
        </Flex>
      </Box>

      {/* Mobile floating menu button */}
      <IconButton
        aria-label="Open menu"
        variant="solid"
        colorPalette="gray"
        display={{ base: "inline-flex", md: "none" }}
        position="fixed"
        bottom={{ base: "128px" }}
        right={4}
        zIndex={90}
        borderRadius="full"
        boxShadow="md"
        onClick={() => setDrawerOpen(true)}
      >
        <FiMenu size={16} />
      </IconButton>

      {/* Mobile drawer */}
      <Portal>
        <Drawer.Root
          open={drawerOpen}
          onOpenChange={(e) => setDrawerOpen(e.open)}
          size={"xs"}
          placement="start"
        >
          <Drawer.Positioner paddingTop={0} paddingBottom={[0, "117px"]}>
            <Drawer.Content
              boxShadow="none"
              borderRightStyle="solid"
              borderRightWidth={"1px"}
              borderRightColor={"brand.0"}
            >
              <Drawer.Body>
                <VStack align="stretch" gap={1} mt={2}>
                  {menuItems.map((item) => {
                    const active = current === item.href;
                    const ItemIcon = getItemIcon(item.href);
                    return (
                      <Link
                        key={item.href}
                        as={NextLink}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
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

      {/* Main content */}
      <Box flex="1" minW={0} px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
        {children}
      </Box>
    </Flex>
  );
}
