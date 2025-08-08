// components/UsernameSelect.tsx
"use client";

import * as React from "react";
import { Select, Portal, createListCollection } from "@chakra-ui/react";
import { useUsername } from "@/providers/UsernameProvider";

export type UsernameSelectProps = {
  usernames: string[];
  includeAllOption?: boolean;
  /** Chakra responsive size array is fine here */
  size?: ("xs" | "sm" | "md" | "lg")[];
  variant?: "subtle" | "outline";
  width?: string;
  /**
   * Optional override: control the value externally.
   * If omitted, the component uses UsernameProvider's value.
   */
  value?: string;
  onChange?: (username: string) => void;
};

export default function UsernameSelect({
  usernames,
  includeAllOption = false,
  size = ["sm", "md", "md"],
  variant = "subtle",
  width = "100%",
  value,
  onChange,
}: UsernameSelectProps) {
  const { username: ctxValue, setUsername: setCtxValue } = useUsername();

  // Allow controlled usage via props, else fall back to context
  const selectedUsername = value ?? ctxValue;
  const setSelectedUsername = onChange ?? setCtxValue;

  const items = React.useMemo(
    () =>
      includeAllOption
        ? [
            { label: "All Libraries", value: "" },
            ...usernames.map((u) => ({ label: u, value: u })),
          ]
        : usernames.map((u) => ({ label: u, value: u })),
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
      value={selectedUsername ? [selectedUsername] : []}
      onValueChange={(vals) => setSelectedUsername(vals.value[0] || "")}
      width={width}
      size={size}
      variant={variant}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Choose user library" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
          <Select.ClearTrigger />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {items.map((item) => (
              <Select.Item key={item.value ?? item.label} item={item}>
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
