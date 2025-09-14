import React from "react";
import { Box, Text, Textarea } from "@chakra-ui/react";

type Props = { label: string } & React.ComponentProps<typeof Textarea>;

export default function LabeledTextarea({ label, ...props }: Props) {
  return (
    <Box>
      <Text mb={1} fontSize="sm">
        {label}
      </Text>
      <Textarea {...props} />
    </Box>
  );
}
