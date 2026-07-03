"use client";

import React, { useState } from "react";
import {
  Button,
  Menu,
  Portal,
  Drawer,
  Box,
  Flex,
  Text,
  Stack,
  CloseButton,
} from "@chakra-ui/react";
import {
  FiCopy,
  FiDownload,
  FiEdit,
  FiLayers,
  FiMoreVertical,
  FiPlay,
  FiSave,
  FiZap,
  FiClock,
} from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";
import { PiDna, PiFilePdf } from "react-icons/pi";
import { LuFileJson, LuFileInput } from "react-icons/lu";

export interface PlaylistActionsMenuProps {
  disabled?: boolean;
  onSortGreedy: () => void;
  onSortGenetic: () => void;
  onSortCohesiveBlocks: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onExportPdf: () => void;
  onOpenSaveDialog: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onEnqueueMissingDownloads?: () => void;
  onBackfillDuration?: () => void;
  onOpenRecommendations?: () => void;
  isGeneticSorting?: boolean;
  isCohesiveBlocksSorting?: boolean;
  enqueuePlaylist: () => void;
  playlistName?: string;
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
  disabled,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <Box
      as="button"
      onClick={disabled ? undefined : onClick}
      w="full"
      textAlign="left"
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.4 : 1}
    >
      <Flex align="center" gap={4} px={5} py={3.5} w="full" color={color} _hover={{ bg: "bg.subtle" }}>
        <Box flexShrink={0} fontSize="md">{icon}</Box>
        <Text fontSize="md">{label}</Text>
      </Flex>
    </Box>
  );
}

function DrawerSectionLabel({ label }: { label: string }) {
  return (
    <Flex px={5} pt={3} pb={1}>
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
        {label}
      </Text>
    </Flex>
  );
}

export default function PlaylistActionsMenu({
  disabled,
  onSortGreedy,
  onSortGenetic,
  onSortCohesiveBlocks,
  onExportJson,
  onImportJson,
  onExportPdf,
  onOpenSaveDialog,
  onDuplicate,
  onRename,
  onEnqueueMissingDownloads,
  onBackfillDuration,
  onOpenRecommendations,
  enqueuePlaylist,
  isGeneticSorting,
  isCohesiveBlocksSorting,
  playlistName,
}: PlaylistActionsMenuProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const close = () => setDrawerOpen(false);

  return (
    <>
      {/* Mobile: bottom sheet */}
      <Box display={{ base: "block", md: "none" }}>
        <Button
          size="sm"
          variant="outline"
          aria-label="Playlist actions"
          px={2}
          disabled={disabled}
          onClick={() => setDrawerOpen(true)}
        >
          <FiMoreVertical />
        </Button>
        <Drawer.Root placement="bottom" open={drawerOpen} onOpenChange={(d) => setDrawerOpen(d.open)}>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content borderTopRadius="xl" maxH="85vh">
                <Drawer.Header borderBottomWidth="1px" py={3} px={5} position="relative">
                  <Box pr={8}>
                    <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                      {playlistName ?? "Playlist Actions"}
                    </Text>
                  </Box>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton size="sm" position="absolute" right={3} top="50%" transform="translateY(-50%)" />
                  </Drawer.CloseTrigger>
                </Drawer.Header>
                <Drawer.Body p={0} overflowY="auto">
                  <Stack gap={0}>
                    <DrawerSectionLabel label="Sort" />
                    <DrawerItem icon={<GiTakeMyMoney />} label="Greedy Order" onClick={() => { onSortGreedy(); close(); }} />
                    <DrawerItem
                      icon={<PiDna />}
                      label={isGeneticSorting ? "Sorting..." : "Genetic Order"}
                      disabled={isGeneticSorting}
                      onClick={() => { onSortGenetic(); close(); }}
                    />
                    <DrawerItem
                      icon={<FiLayers />}
                      label={isCohesiveBlocksSorting ? "Sorting..." : "Cohesive Blocks"}
                      disabled={isCohesiveBlocksSorting}
                      onClick={() => { onSortCohesiveBlocks(); close(); }}
                    />
                    {onOpenRecommendations && (
                      <DrawerItem icon={<FiZap />} label="AI Recommendations" onClick={() => { onOpenRecommendations(); close(); }} />
                    )}
                    {drawerDivider}
                    <DrawerSectionLabel label="Export & Save" />
                    <DrawerItem icon={<LuFileJson />} label="Export JSON" onClick={() => { onExportJson(); close(); }} />
                    <DrawerItem icon={<LuFileInput />} label="Import & Append JSON" onClick={() => { onImportJson(); close(); }} />
                    <DrawerItem icon={<PiFilePdf />} label="Export PDF" onClick={() => { onExportPdf(); close(); }} />
                    <DrawerItem icon={<FiSave />} label="Save Playlist" onClick={() => { onOpenSaveDialog(); close(); }} />
                    {(onDuplicate || onRename) && (
                      <>
                        {drawerDivider}
                        {onDuplicate && (
                          <DrawerItem icon={<FiCopy />} label="Duplicate Playlist" onClick={() => { onDuplicate(); close(); }} />
                        )}
                        {onRename && (
                          <DrawerItem icon={<FiEdit />} label="Rename Playlist" onClick={() => { onRename(); close(); }} />
                        )}
                      </>
                    )}
                    {(onEnqueueMissingDownloads || onBackfillDuration) && (
                      <>
                        {drawerDivider}
                        {onEnqueueMissingDownloads && (
                          <DrawerItem icon={<FiDownload />} label="Enqueue Missing Downloads" onClick={() => { onEnqueueMissingDownloads(); close(); }} />
                        )}
                        {onBackfillDuration && (
                          <DrawerItem icon={<FiClock />} label="Backfill Duration from Audio" onClick={() => { onBackfillDuration(); close(); }} />
                        )}
                      </>
                    )}
                    {drawerDivider}
                    <DrawerItem icon={<FiPlay />} label="Enqueue Playlist" onClick={() => { enqueuePlaylist(); close(); }} />
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
            <Button
              size="sm"
              variant="outline"
              aria-label="Playlist actions"
              px={2}
              disabled={disabled}
            >
              <FiMoreVertical />
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Flex px={3} py={1} fontWeight="bold" fontSize="sm" color="gray.500">
                Playlist Sort
              </Flex>
              {menuDivider}
              <Menu.Item value="sort-greedy" onSelect={onSortGreedy}>
                <GiTakeMyMoney /> Greedy Order
              </Menu.Item>
              <Menu.Item value="sort-genetic" onSelect={onSortGenetic} disabled={isGeneticSorting}>
                <PiDna /> {isGeneticSorting ? "Sorting..." : "Genetic Order"}
              </Menu.Item>
              <Menu.Item value="sort-cohesive-blocks" onSelect={onSortCohesiveBlocks} disabled={isCohesiveBlocksSorting}>
                <FiLayers /> {isCohesiveBlocksSorting ? "Sorting..." : "Cohesive Blocks"}
              </Menu.Item>
              {onOpenRecommendations && (
                <Menu.Item value="recommendations" onSelect={onOpenRecommendations}>
                  <FiZap /> AI Recommendations
                </Menu.Item>
              )}
              {menuDivider}
              <Menu.Item value="export-json" onSelect={onExportJson}>
                <LuFileJson /> Export JSON
              </Menu.Item>
              <Menu.Item value="import-json" onSelect={onImportJson}>
                <LuFileInput /> Import & Append JSON
              </Menu.Item>
              <Menu.Item value="export-pdf" onSelect={onExportPdf}>
                <PiFilePdf /> Export PDF
              </Menu.Item>
              <Menu.Item value="save" onSelect={onOpenSaveDialog}>
                <FiSave /> Save Playlist
              </Menu.Item>
              {(onDuplicate || onRename) && (
                <>
                  {menuDivider}
                  {onDuplicate && (
                    <Menu.Item value="duplicate" onSelect={onDuplicate}>
                      <FiCopy /> Duplicate Playlist
                    </Menu.Item>
                  )}
                  {onRename && (
                    <Menu.Item value="rename" onSelect={onRename}>
                      <FiEdit /> Rename Playlist
                    </Menu.Item>
                  )}
                </>
              )}
              {(onEnqueueMissingDownloads || onBackfillDuration) && (
                <>
                  {menuDivider}
                  {onEnqueueMissingDownloads && (
                    <Menu.Item value="enqueue-missing" onSelect={onEnqueueMissingDownloads}>
                      <FiDownload /> Enqueue Missing Downloads
                    </Menu.Item>
                  )}
                  {onBackfillDuration && (
                    <Menu.Item value="backfill-duration" onSelect={onBackfillDuration}>
                      <FiClock /> Backfill Duration from Audio
                    </Menu.Item>
                  )}
                </>
              )}
              {menuDivider}
              <Menu.Item value="enqueue" onSelect={enqueuePlaylist}>
                <FiPlay /> Enqueue Playlist
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Box>
    </>
  );
}
