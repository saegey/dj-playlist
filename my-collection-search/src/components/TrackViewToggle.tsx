"use client";

import React from "react";
import { IconButton } from "@chakra-ui/react";
import { LuLayoutGrid, LuRows3 } from "react-icons/lu";
import type { TrackViewMode } from "@/hooks/useTrackViewMode";

type Props = {
  value: TrackViewMode;
  onChange: (mode: TrackViewMode) => void;
};

/** The Rows / Cards icon buttons shared by track lists. Desktop only: phones always get cards. */
export default function TrackViewToggle({ value, onChange }: Props) {
  return (
    <>
      <IconButton
        aria-label="Rows view"
        aria-pressed={value === "row"}
        size="sm"
        variant={value === "row" ? "solid" : "ghost"}
        onClick={() => onChange("row")}
      >
        <LuRows3 />
      </IconButton>
      <IconButton
        aria-label="Cards view"
        aria-pressed={value === "card"}
        size="sm"
        variant={value === "card" ? "solid" : "ghost"}
        onClick={() => onChange("card")}
      >
        <LuLayoutGrid />
      </IconButton>
    </>
  );
}
