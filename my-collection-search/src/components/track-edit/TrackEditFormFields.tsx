"use client";

import React from "react";
import { Box, Button, Flex, Stack, Text, RatingGroup } from "@chakra-ui/react";
import LabeledInput from "@/components/form/LabeledInput";
import LabeledTextarea from "@/components/form/LabeledTextarea";
import type { TrackEditFormState } from "@/components/track-edit/types";

type TrackEditFormFieldsProps = {
  values: TrackEditFormState;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onStarRatingChange: (rating: number) => void;
};

export default function TrackEditFormFields({
  values,
  loading,
  onChange,
  onStarRatingChange,
}: TrackEditFormFieldsProps) {
  return (
    <>
      <Stack
        borderWidth={{ base: "0", md: "1px" }}
        borderRadius="md"
        padding={{ base: 2, md: 4 }}
        marginBottom={{ base: 2, md: 4 }}
        marginTop={{ base: 2, md: 4 }}
      >
        <LabeledInput
          label="Title"
          name="title"
          value={values.title}
          onChange={onChange}
        />
        <LabeledInput
          label="Artist"
          name="artist"
          value={values.artist}
          onChange={onChange}
        />
        <LabeledInput
          label="Album"
          name="album"
          value={values.album}
          onChange={onChange}
        />
        <Flex gap={2} flexWrap="wrap">
          <Box flex={{ base: "1 1 calc(50% - 4px)", md: "1" }}>
            <LabeledInput
              label="BPM"
              name="bpm"
              value={values.bpm}
              onChange={onChange}
              type="number"
            />
          </Box>
          <Box flex={{ base: "1 1 calc(50% - 4px)", md: "1" }}>
            <LabeledInput
              label="Key"
              name="key"
              value={values.key}
              onChange={onChange}
            />
          </Box>
          <Box flex={{ base: "1 1 calc(50% - 4px)", md: "1" }}>
            <LabeledInput
              label="Danceability"
              name="danceability"
              value={values.danceability ?? ""}
              onChange={onChange}
              type="number"
            />
          </Box>
          <Box flex={{ base: "1 1 calc(50% - 4px)", md: "1" }}>
            <LabeledInput
              label="Duration (seconds)"
              name="duration_seconds"
              value={values.duration_seconds ?? ""}
              onChange={onChange}
              type="number"
            />
          </Box>
        </Flex>
        <LabeledInput
          label="Genre (comma separated)"
          name="local_tags"
          value={values.local_tags}
          onChange={onChange}
        />
        <LabeledTextarea
          label="Notes"
          name="notes"
          value={values.notes}
          height={"100px"}
          onChange={onChange}
        />
        <LabeledInput
          label="Apple Music URL"
          name="apple_music_url"
          value={values.apple_music_url || ""}
          onChange={onChange}
        />
        <LabeledInput
          label="YouTube URL"
          name="youtube_url"
          value={values.youtube_url || ""}
          onChange={onChange}
        />
        <LabeledInput
          label="SoundCloud URL"
          name="soundcloud_url"
          value={values.soundcloud_url || ""}
          onChange={onChange}
        />

        <Box>
          <Text mb={1} fontSize="sm">
            Rating
          </Text>
          <RatingGroup.Root
            value={values.star_rating}
            onValueChange={({ value }) => onStarRatingChange(value)}
            size="md"
            count={5}
          >
            <RatingGroup.HiddenInput />
            <RatingGroup.Control />
          </RatingGroup.Root>
        </Box>
      </Stack>
      <Button type="submit" loading={loading} disabled={loading} size={"sm"}>
        Save
      </Button>
    </>
  );
}
