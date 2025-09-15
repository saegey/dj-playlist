"use client";

import React, { useMemo } from "react";
import { Box, HStack, Slider, Text } from "@chakra-ui/react";
import { usePlaylistPlayerTime } from "@/providers/PlaylistPlayerProvider";

type Props = { seek: (time: number) => void };

const ProgressSlider: React.FC<Props> = React.memo(({ seek }) => {
  const { currentTime, duration } = usePlaylistPlayerTime();

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.max(0, Math.min(100, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const fmt = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <HStack gap={3} align="center" mb={2}>
      <Text fontSize="xs" minW="36px" textAlign="right" color="fg.muted">
        {fmt(currentTime || 0)}
      </Text>
      <Box flex="1">
        <Slider.Root
          width="100%"
          value={[progress]}
          onValueChange={(e) => {
            const pct = e.value[0] ?? 0;
            const target = (Math.max(0, Math.min(100, pct)) / 100) * (duration || 0);
            if (Number.isFinite(target)) seek(target);
          }}
          max={100}
          step={0.1}
        >
          <Slider.Control>
            <Slider.Track bg="brand.0" height="8px" borderRadius="full">
              <Slider.Range bg="accent.solid" />
            </Slider.Track>
            <Slider.Thumbs rounded="full" />
          </Slider.Control>
        </Slider.Root>
      </Box>
      <Text fontSize="xs" minW="36px" color="fg.muted">
        {fmt(duration || 0)}
      </Text>
    </HStack>
  );
});
ProgressSlider.displayName = "ProgressSlider";

export default ProgressSlider;
