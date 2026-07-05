"use client";

import React, { useMemo } from "react";
import { Box, Slider } from "@chakra-ui/react";
import { usePlaylistPlayerTime } from "@/providers/PlaylistPlayerProvider";

type Props = { seek: (time: number) => void };

const CompactProgressSlider: React.FC<Props> = React.memo(({ seek }) => {
  const { currentTime, duration } = usePlaylistPlayerTime();

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.max(0, Math.min(100, (currentTime / duration) * 100));
  }, [currentTime, duration]);

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
          <Slider.Track bg="blackAlpha.200" height="2px" borderRadius="full">
            <Slider.Range bg="accent.solid" />
          </Slider.Track>
          <Slider.Thumbs
            rounded="full"
            width="8px"
            height="8px"
            bg="accent.solid"
            borderWidth="0"
            boxShadow="none"
          />
        </Slider.Control>
      </Slider.Root>
    </Box>
  );
});

CompactProgressSlider.displayName = "CompactProgressSlider";

export default CompactProgressSlider;
