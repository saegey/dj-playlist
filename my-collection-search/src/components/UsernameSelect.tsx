// components/UsernameSelect.tsx
"use client";

import * as React from "react";
import {
  Button,
  Menu,
  Portal,
  Spinner,
  useBreakpointValue,
  HStack,
  Icon,
  Box,
} from "@chakra-ui/react";
import type { ButtonProps } from "@chakra-ui/react";
import { FiUser, FiX } from "react-icons/fi";
import { useUsername } from "@/providers/UsernameProvider";
import { Friend } from "@/types/track";

export type UsernameSelectProps = {
  usernames: Friend[];
  includeAllOption?: boolean;
  /** Chakra responsive size array is fine here */
  size?: ButtonProps["size"] | ButtonProps["size"][];
  variant?: ButtonProps["variant"] | ButtonProps["variant"][];
  width?: string | number;
  /** Loading state for when usernames are being fetched */
  isLoading?: boolean;
  /** Text to show while loading */
  loadingText?: string;
  /** Disable the select while loading (default true) */
  disableWhileLoading?: boolean;
  /**
   * Optional override: control the value externally.
   * If omitted, the component uses UsernameProvider's value.
   */
  value?: Friend | null;
  onChange?: (friend_id: number) => void;
};

export default function UsernameSelect({
  usernames,
  includeAllOption = false,
  size = ["sm", "md", "md"],
  variant = "subtle",
  width = "100%",
  isLoading = false,
  loadingText = "Loading...",
  disableWhileLoading = true,
  value,
  onChange,
}: UsernameSelectProps) {
  // Context holds Friend | null; external value can override
  const { friend: ctxValue, setFriend: setCtxValue } = useUsername();
  const selectedFriend: Friend | null = value ?? (ctxValue as Friend | null);

  const buttonLabel = React.useMemo(() => {
    if (isLoading) return loadingText;
    if (selectedFriend) return selectedFriend.username;
    if (includeAllOption) return "All Libraries";
    return "Choose user library";
  }, [isLoading, loadingText, selectedFriend, includeAllOption]);

  const handleSelect = (friend: Friend | null) => {
    // External change only when selecting a friend (not All)
    if (friend && onChange) onChange(friend.id);
    setCtxValue(friend);
  };

  // Resolve responsive size/variant to a concrete token for Button
  const resolvedSize = useBreakpointValue(
    Array.isArray(size)
      ? (size as ButtonProps["size"][])
      : [size as ButtonProps["size"]]
  ) as ButtonProps["size"] | undefined;
  const resolvedVariant = useBreakpointValue(
    Array.isArray(variant)
      ? (variant as ButtonProps["variant"][])
      : [variant as ButtonProps["variant"]]
  ) as ButtonProps["variant"] | undefined;

  return (
    <Menu.Root>
      <Menu.Trigger>
        <Button
          width={width}
          size={resolvedSize}
          variant={resolvedVariant}
          disabled={isLoading && disableWhileLoading}
          aria-busy={isLoading}
          justifyContent="space-between"
        >
          <HStack w="100%" justify="space-between">
            <HStack>
              <Icon as={FiUser} />
              {isLoading && <Spinner size="xs" />}
              <Box>{buttonLabel}</Box>
            </HStack>
            {selectedFriend && (
              <Icon
                as={FiX}
                aria-label="Clear selection"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(null);
                }}
                cursor="pointer"
                color="fg.muted"
              />
            )}
          </HStack>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {includeAllOption && (
              <Menu.Item value="all" onClick={() => handleSelect(null)}>
                All Libraries
              </Menu.Item>
            )}
            {usernames.map((u) => (
              <Menu.Item
                key={u.id}
                value={String(u.id)}
                onClick={() => handleSelect(u)}
              >
                {u.username}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
