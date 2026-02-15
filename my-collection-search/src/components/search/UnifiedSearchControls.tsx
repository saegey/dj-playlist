"use client";

import React from "react";
import { Box, Flex, Input, InputGroup } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import UsernameSelect from "@/components/UsernameSelect";
import type { Friend } from "@/types/track";

type UnifiedSearchControlsProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onQueryEnter?: () => void;
  friends: Friend[];
  selectedFriend?: Friend | null;
  onFriendChange?: (friendId: number) => void;
  includeAllOption?: boolean;
  placeholder?: string;
  desktopControls?: React.ReactNode;
  mobilePrimaryControl?: React.ReactNode;
  mobileSecondaryControls?: React.ReactNode;
};

export default function UnifiedSearchControls({
  query,
  onQueryChange,
  onQueryEnter,
  friends,
  selectedFriend,
  onFriendChange,
  includeAllOption = false,
  placeholder = "Search...",
  desktopControls,
  mobilePrimaryControl,
  mobileSecondaryControls,
}: UnifiedSearchControlsProps) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onQueryEnter) onQueryEnter();
    },
    [onQueryEnter]
  );

  return (
    <Box
      mb={3}
      p={{ base: 2, md: 3 }}
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.subtle"
      boxShadow="sm"
    >
      {/* Desktop */}
      <Flex display={{ base: "none", md: "flex" }} gap={2} align="center">
        <InputGroup startElement={<LuSearch size={16} />} flex="1" maxW="520px">
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="subtle"
            fontSize="16px"
            placeholder={placeholder}
          />
        </InputGroup>
        <Box width="200px" flexShrink={0}>
          <UsernameSelect
            usernames={friends}
            includeAllOption={includeAllOption}
            value={selectedFriend}
            onChange={onFriendChange}
            size="md"
          />
        </Box>
        {desktopControls ? <Flex gap={2} align="center">{desktopControls}</Flex> : null}
      </Flex>

      {/* Mobile */}
      <Flex display={{ base: "flex", md: "none" }} direction="column" gap={2}>
        <Flex gap={2} align="center">
          <InputGroup startElement={<LuSearch size={16} />} flex="1">
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              variant="subtle"
              fontSize="16px"
              size="sm"
              placeholder={placeholder}
            />
          </InputGroup>
          <UsernameSelect
            usernames={friends}
            includeAllOption={includeAllOption}
            value={selectedFriend}
            onChange={onFriendChange}
            iconOnlyMobile={true}
            width="auto"
            size="sm"
          />
          {mobilePrimaryControl}
        </Flex>
        {mobileSecondaryControls ? (
          <Flex gap={2} align="center" wrap="wrap">
            {mobileSecondaryControls}
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
}
