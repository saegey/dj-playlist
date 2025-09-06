"use client";

import React from "react";
import { ActionBar, Button, CloseButton, Portal } from "@chakra-ui/react";
import { LuLightbulb, LuMusic } from "react-icons/lu";

type Props = {
  selectedCount: number;
  analyzing: boolean;
  onVectorize: () => void;
  onAnalyze: () => void;
  onClose: () => void;
};

export default function BackfillActionBar({
  selectedCount,
  analyzing,
  onVectorize,
  onAnalyze,
  onClose,
}: Props) {
  return (
    <ActionBar.Root
      open={selectedCount > 0}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      closeOnInteractOutside={false}
      portalled={false}
    >
      <Portal>
        <ActionBar.Positioner mb={"200px"}>
          <ActionBar.Content>
            <ActionBar.SelectionTrigger>
              {selectedCount} selected
            </ActionBar.SelectionTrigger>
            <ActionBar.Separator />
            <Button
              variant="outline"
              size="sm"
              onClick={onVectorize}
              disabled={!selectedCount || analyzing}
            >
              <LuLightbulb style={{ marginRight: 4 }} />
              Vectorize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
              disabled={!selectedCount || analyzing}
            >
              <LuMusic style={{ marginRight: 4 }} />
              Analyze Audio
            </Button>
            <ActionBar.CloseTrigger asChild>
              <CloseButton size="sm" />
            </ActionBar.CloseTrigger>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  );
}
