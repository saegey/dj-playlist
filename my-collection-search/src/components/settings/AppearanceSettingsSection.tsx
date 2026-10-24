"use client";

import React from "react";
import { Box, chakra, Flex, Heading, SegmentGroup, Spinner, Text } from "@chakra-ui/react";
import { palettes, paletteIds, resolvePaletteId, type PaletteId } from "@/app/palettes";
import { toaster } from "@/components/ui/toaster";
import { useColorMode, type ThemeSetting } from "@/components/ui/color-mode";
import {
  useAppearanceSettingsQuery,
  useUpdateAppearanceSettings,
} from "@/hooks/useAppearanceSettings";

const MODES: { value: ThemeSetting; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/** The four swatches a card shows, by the variable that holds each. */
const SWATCHES = [
  ["Ground", "--gn-ground"],
  ["Surface", "--gn-surface"],
  ["Ink", "--gn-ink"],
  ["Accent", "--gn-accent-solid"],
] as const;

const paletteName = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

/** The shared palette and this device's light/dark choice. */
export default function AppearanceSettingsSection(): React.JSX.Element {
  const settings = useAppearanceSettingsQuery();
  const update = useUpdateAppearanceSettings();
  const { colorMode, colorModeSetting, setColorModeSetting } = useColorMode();

  const selected: PaletteId = resolvePaletteId(
    update.isPending ? update.variables : settings.data?.palette
  );

  const choose = (palette: PaletteId) => {
    if (palette === selected) return;
    update.mutate(palette, {
      onError: (err) =>
        toaster.create({
          title: "Failed to save palette",
          description: err instanceof Error ? err.message : String(err),
          type: "error",
        }),
    });
  };

  return (
    <Box>
      <Heading size="lg" mb={2}>
        Appearance
      </Heading>

      <Heading size="md" mb={1}>
        Palette
      </Heading>
      <Text color="fg.muted" mb={3}>
        Colours for the whole app, shared by every device.
      </Text>
      <Flex gap={3} align="stretch" flexWrap="wrap" role="radiogroup" aria-label="Palette" mb={2}>
        {paletteIds.map((id) => {
          const values = palettes[id][colorMode];
          const isSelected = id === selected;
          return (
            <chakra.button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => choose(id)}
              textAlign="left"
              p={3}
              minW="180px"
              borderWidth={isSelected ? 2 : 1}
              borderColor={isSelected ? "accent.solid" : "border"}
              borderRadius="md"
              bg="bg.panel"
              cursor="pointer"
              _hover={{ bg: "bg.muted" }}
            >
              <Flex gap={1} mb={2} aria-hidden>
                {SWATCHES.map(([label, variable]) => (
                  <Box
                    key={variable}
                    title={label}
                    w={8}
                    h={8}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="border"
                    style={{ backgroundColor: values[variable] }}
                  />
                ))}
              </Flex>
              <Text fontWeight="medium">{paletteName(id)}</Text>
            </chakra.button>
          );
        })}
      </Flex>
      <Flex gap={2} align="center" mb={6} minH={5}>
        {update.isPending || settings.isPending ? <Spinner size="sm" /> : null}
        {settings.error ? (
          <Text fontSize="sm" color="fg.error">
            Failed to load the saved palette.
          </Text>
        ) : null}
      </Flex>

      <Heading size="md" mb={1}>
        Mode
      </Heading>
      <Text color="fg.muted" mb={3}>
        Light, dark, or follow the operating system. Remembered on this device only.
      </Text>
      <SegmentGroup.Root
        size="sm"
        value={colorModeSetting}
        aria-label="Colour mode"
        onValueChange={(details) => setColorModeSetting(details.value as ThemeSetting)}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items items={MODES} />
      </SegmentGroup.Root>
    </Box>
  );
}
