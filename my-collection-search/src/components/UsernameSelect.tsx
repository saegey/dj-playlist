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
  // Context holds Friend | null; external value can override
  const { friend: ctxValue, setFriend: setCtxValue } = useUsername();
  const selectedFriend: Friend | null = value ?? (ctxValue as Friend | null);

  const items = React.useMemo(
    () =>
      includeAllOption
        ? [
            { label: "All Libraries", value: "" },
            ...usernames.map((u) => ({ label: u.username, value: String(u.id) })),
          ]
        : usernames.map((u) => ({ label: u.username, value: String(u.id) })),
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
      value={selectedFriend?.id != null ? [String(selectedFriend.id)] : includeAllOption ? [""] : undefined}
      onValueChange={(vals) => {
        const idStr = vals.value[0] ?? "";
        const idNum = idStr === "" ? null : Number(idStr);
        // Fire external change with friend_id when available
        if (onChange && idNum !== null && !Number.isNaN(idNum)) {
          onChange(idNum);
        }
        // Update context with full Friend object (or null for All)
        const friendObj = idNum === null ? null : usernames.find((u) => u.id === idNum) || null;
        setCtxValue(friendObj);
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
              <Select.Item key={String(item.value)} item={item}>
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
