"use client";

import React, { useMemo } from "react";
import { Box, Flex, Slider, Text } from "@chakra-ui/react";
import { usePlaylistPlayerTime } from "@/providers/PlaylistPlayerProvider";

type Props = { seek: (time: number) => void };

const CompactProgressSlider: React.FC<Props> = React.memo(({ seek }) => {
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
    <Box>
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
          <Slider.Track bg="brand.0" height="4px" borderRadius="full">
            <Slider.Range bg="accent.solid" />
          </Slider.Track>
          <Slider.Thumbs rounded="full" />
        </Slider.Control>
      </Slider.Root>
      <Flex justify="space-between" mt={1}>
        <Text fontSize="xs" color="fg.muted">
          {fmt(currentTime || 0)}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {fmt(duration || 0)}
        </Text>
      </Flex>
    </Box>
  );
});

CompactProgressSlider.displayName = "CompactProgressSlider";

export default CompactProgressSlider;
