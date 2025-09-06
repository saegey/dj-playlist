import React from "react";
import { Box, Input, Text } from "@chakra-ui/react";

type Props = { label: string } & React.ComponentProps<typeof Input>;

export default function LabeledInput({ label, ...props }: Props) {
  return (
    <Box flex="1">
      <Text mb={1} fontSize="sm">
        {label}
      </Text>
      <Input {...props} />
    </Box>
  );
}
