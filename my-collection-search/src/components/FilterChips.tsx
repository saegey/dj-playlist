"use client";

import React from "react";
import { Flex, Button, type FlexProps } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";

export interface FilterChip {
  key: string;
  label: string;
  active: boolean;
  /** Results the filter matches, shown in the label ("Missing audio · 41"). Omit where unknown. */
  count?: number;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onToggle: (key: string) => void;
  onClearAll?: () => void;
  /**
   * Controls shown before the chips, such as the genre filter. Desktop only:
   * phones reach them through the filter sheet.
   */
  leading?: React.ReactNode;
  /** Space above the row, which goes with it when it's hidden. */
  mt?: FlexProps["mt"];
}

/** The chip's text: its label, then the count when the data has one. */
export function chipLabel({ label, count }: Pick<FilterChip, "label" | "count">): string {
  return count === undefined ? label : `${label} · ${count.toLocaleString()}`;
}

export default function FilterChips({ chips, onToggle, onClearAll, leading, mt }: FilterChipsProps) {
  const anyActive = chips.some((c) => c.active);

  return (
    <Flex
      gap={2}
      flexWrap="wrap"
      alignItems="center"
      mt={mt}
      // On phones the row holds only chips, so with none it takes no space.
      display={{ base: chips.length > 0 ? "flex" : "none", md: "flex" }}
    >
      {leading && (
        <Flex gap={2} flexWrap="wrap" alignItems="center" display={{ base: "none", md: "flex" }}>
          {leading}
        </Flex>
      )}
      {chips.map((chip) => (
        <Button
          key={chip.key}
          size="sm"
          variant={chip.active ? "solid" : "outline"}
          colorPalette="neutral"
          onClick={() => onToggle(chip.key)}
          px={3}
        >
          {chipLabel(chip)}
          {chip.active && <LuX />}
        </Button>
      ))}
      {anyActive && onClearAll && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearAll}
          color="fg.muted"
        >
          Clear all
        </Button>
      )}
    </Flex>
  );
}
