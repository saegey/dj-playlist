import * as React from "react";
import { Select, Portal, createListCollection } from "@chakra-ui/react";
export type UseUsernameSelectProps = {
  usernames: string[];
  selectedUsername: string;
  setSelectedUsername: (username: string) => void;
  size?: ("sm" | "md" | "lg" | "xs")[];
  variant?: "subtle" | "outline";
  width?: string;
};

export function useUsernameSelect({
  usernames,
  selectedUsername,
  setSelectedUsername,
  size = ["sm", "md", "md"],
  variant = "subtle",
  width = "100%",
}: UseUsernameSelectProps) {
  const usernameCollection = React.useMemo(
    () => createListCollection({
      items: usernames.map((u) => ({ label: u, value: u })),
    }),
    [usernames]
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
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Choose user library" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {usernames.map((u) => (
              <Select.Item key={u} item={{ label: u, value: u }}>
                {u}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
