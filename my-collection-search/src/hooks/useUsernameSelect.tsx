import * as React from "react";
import { Select, Portal, createListCollection } from "@chakra-ui/react";
export type UseUsernameSelectProps = {
  usernames: string[];
  selectedUsername: string;
  setSelectedUsername: (username: string) => void;
  size?: ("sm" | "md" | "lg" | "xs")[];
  variant?: "subtle" | "outline";
  width?: string;
  includeAllOption?: boolean;
};


export function useUsernameSelect({
  usernames,
  selectedUsername,
  setSelectedUsername,
  size = ["sm", "md", "md"],
  variant = "subtle",
  width = "100%",
  includeAllOption = false,
}: UseUsernameSelectProps) {
  const items = React.useMemo(
    () =>
      includeAllOption
        ? [{ label: "All Libraries", value: "" }, ...usernames.map((u) => ({ label: u, value: u }))]
        : usernames.map((u) => ({ label: u, value: u })),
    [usernames, includeAllOption]
  );

  const usernameCollection = React.useMemo(
    () => createListCollection({
      items,
    }),
    [items]
  );

  return (
    <Select.Root
      collection={usernameCollection}
      value={selectedUsername ? [selectedUsername] : []}
      onValueChange={(vals) => setSelectedUsername(vals.value[0] || "")}
      width={width}
      size={size}
      variant={variant}
    >
      {/* <Select.Label>Select library</Select.Label> */}
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
