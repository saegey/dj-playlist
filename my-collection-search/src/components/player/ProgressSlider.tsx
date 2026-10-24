"use client";

import React, { useMemo } from "react";
import { Box, HStack, Slider, Text } from "@chakra-ui/react";
import { usePlaylistPlayerTime } from "@/providers/PlaylistPlayerProvider";
import { formatSeconds } from "@/lib/trackUtils";

type Props = { seek: (time: number) => void };

const ProgressSlider: React.FC<Props> = React.memo(({ seek }) => {
  const { currentTime, duration } = usePlaylistPlayerTime();

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.max(0, Math.min(100, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  return (
    <HStack gap={3} align="center" mb={2}>
      <Text
        fontFamily="label"
        fontSize="xs"
        minW="36px"
        textAlign="right"
        color="fg.muted"
        fontVariantNumeric="tabular-nums"
      >
        {formatSeconds(currentTime || 0)}
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
            <Slider.Track bg="bg.panel" height="12px" borderWidth="outline" borderColor="border.ink">
              <Slider.Range bg="accent.solid" />
            </Slider.Track>
            <Slider.Thumbs
              rounded="none"
              width="14px"
              height="22px"
              bg="neutral.solid"
              borderWidth="0"
              boxShadow="none"
            />
          </Slider.Control>
        </Slider.Root>
      </Box>
      <Text
        fontFamily="label"
        fontSize="xs"
        minW="36px"
        color="fg.muted"
        fontVariantNumeric="tabular-nums"
      >
        {formatSeconds(duration || 0)}
      </Text>
    </HStack>
  );
});
ProgressSlider.displayName = "ProgressSlider";

export default ProgressSlider;
