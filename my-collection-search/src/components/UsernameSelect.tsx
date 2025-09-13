// components/UsernameSelect.tsx
"use client";

import * as React from "react";
import {
  Select,
  Portal,
  createListCollection,
  Spinner,
} from "@chakra-ui/react";
import { useUsername } from "@/providers/UsernameProvider";
import { Friend } from "@/types/track";

export type UsernameSelectProps = {
  usernames: Friend[];
  includeAllOption?: boolean;
  /** Chakra responsive size array is fine here */
  size?: ("xs" | "sm" | "md" | "lg")[];
  variant?: "subtle" | "outline";
  width?: string;
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
  // Context value is assumed to be friend id (number or "")
  const { friend: ctxValue, setFriend: setCtxValue } = useUsername();
  console.log(usernames, ctxValue);

  // Controlled value: id (number or "")
  const selectedFriend = value ? value : ctxValue;
  const setSelectedId = onChange ?? setCtxValue;

  const items = React.useMemo(
    () =>
      includeAllOption
        ? [
            { label: "All Libraries", value: "" },
            ...usernames.map((u) => ({ label: u.username, value: u.id })),
          ]
        : usernames.map((u) => ({ label: u.username, value: u.id })),
    [usernames, includeAllOption]
  );

  const collection = React.useMemo(
    () =>
      createListCollection({
        items,
      }),
    [items]
  );

  return (
    <Select.Root
      collection={collection}
      value={
        selectedFriend && selectedFriend.id !== undefined
          ? [String(selectedFriend.id)]
          : undefined
      }
      onValueChange={(vals) => {
        console.log("vals", vals);
        setSelectedId(Number(vals.value[0]));
        setCtxValue(
          vals.items[0]
            ? usernames.find((u) => u.id === vals.items[0].value) || null
            : null
        );
      }}
      width={width}
      size={size}
      variant={variant}
      disabled={isLoading && disableWhileLoading}
      aria-busy={isLoading}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText
            placeholder={isLoading ? loadingText : "Choose user library"}
          />
        </Select.Trigger>
        <Select.IndicatorGroup>
          {isLoading && <Spinner size="xs" mr={2} />}
          <Select.Indicator />
          <Select.ClearTrigger />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {items.map((item) => (
              <Select.Item key={item.label ?? item.label} item={item}>
                {item.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
