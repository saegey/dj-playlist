"use client";

import React from "react";
import { Button, Menu, Flex, Box } from "@chakra-ui/react";
import { FiMoreVertical, FiSave } from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";
import { PiDna, PiFilePdf } from "react-icons/pi";
import { MdOutlineClearAll } from "react-icons/md";
import { LuFileJson } from "react-icons/lu";

export interface PlaylistActionsMenuProps {
  disabled?: boolean;
  onSortGreedy: () => void;
  onSortGenetic: () => void;
  onExportJson: () => void;
  onExportPdf: () => void;
  onOpenSaveDialog: () => void;
  onClear: () => void;
}

/**
 * Dumb, presentational component that renders the playlist actions menu.
 * All behavior is passed in via props.
 */
export default function PlaylistActionsMenu({
  disabled,
  onSortGreedy,
  onSortGenetic,
  onExportJson,
  onExportPdf,
  onOpenSaveDialog,
  onClear,
}: PlaylistActionsMenuProps) {
  return (
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
          <Box as="hr" my={1} borderColor="gray.200" borderWidth={0} borderTopWidth={1} />
          <Menu.Item value="sort-greedy" onSelect={onSortGreedy}>
            <GiTakeMyMoney /> Greedy Order
          </Menu.Item>
          <Menu.Item value="sort-genetic" onSelect={onSortGenetic}>
            <PiDna /> Genetic Order
          </Menu.Item>
          <Box as="hr" my={1} borderColor="gray.200" borderWidth={0} borderTopWidth={1} />
          <Menu.Item value="export-json" onSelect={onExportJson}>
            <LuFileJson /> Export JSON
          </Menu.Item>
          <Menu.Item value="export-pdf" onSelect={onExportPdf}>
            <PiFilePdf /> Export PDF
          </Menu.Item>
          <Menu.Item value="save" onSelect={onOpenSaveDialog}>
            <FiSave /> Save Playlist
          </Menu.Item>
          <Menu.Item
            value="clear"
            onSelect={onClear}
            color="fg.error"
            _hover={{ bg: "bg.error", color: "fg.error" }}
          >
            <MdOutlineClearAll /> Clear Playlist
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
