"use client";

import React from "react";
import { Input, SimpleGrid, Switch, InputGroup } from "@chakra-ui/react";
import UsernameSelect from "@/components/UsernameSelect";
import { LuSearch } from "react-icons/lu";
import { Friend } from "@/types/track";

type Props = {
  friends: Friend[];
  usernamesLoading?: boolean;
  artistSearch: string;
  setArtistSearch: (v: string) => void;
  showMissingAudio: boolean;
  setShowMissingAudio: (v: boolean) => void;
  showMissingVectors: boolean;
  setShowMissingVectors: (v: boolean) => void;
  analyzing: boolean;
  useAsyncProcessing?: boolean;
  setUseAsyncProcessing?: (v: boolean) => void;
};

export default function BackfillFilters({
  friends,
  usernamesLoading,
  artistSearch,
  setArtistSearch,
  showMissingAudio,
  setShowMissingAudio,
  showMissingVectors,
  setShowMissingVectors,
  analyzing,
  useAsyncProcessing,
  setUseAsyncProcessing,
}: Props) {
  return (
    <SimpleGrid columns={[1, null, 6]} gap={4} mt={3} mb={8}>
      <InputGroup startElement={<LuSearch size={16} />}>
        <Input
          type="text"
          placeholder="Search"
          value={artistSearch}
          onChange={(e) => setArtistSearch(e.target.value)}
          disabled={analyzing}
          size={["sm", "md", "md"]}
          variant={"subtle"}
        />
      </InputGroup>
      <Switch.Root
        checked={showMissingAudio}
        onCheckedChange={(e) => setShowMissingAudio(e.checked)}
     >
        <Switch.Label>Missing Audio</Switch.Label>
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label />
      </Switch.Root>
      <Switch.Root
        checked={showMissingVectors}
        onCheckedChange={(e) => setShowMissingVectors(e.checked)}
      >
        <Switch.Label>Missing Vectors</Switch.Label>
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label />
      </Switch.Root>
      <UsernameSelect
        usernames={friends}
        isLoading={usernamesLoading}
        loadingText="Loading usernames..."
      />
      {setUseAsyncProcessing && (
        <Switch.Root
          checked={useAsyncProcessing}
          onCheckedChange={(e) => setUseAsyncProcessing(e.checked)}
        >
          <Switch.Label>Async Processing</Switch.Label>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label />
        </Switch.Root>
      )}
    </SimpleGrid>
  );
}
