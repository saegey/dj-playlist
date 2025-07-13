import { Box, Button } from "@chakra-ui/react";
import { useState as useLocalState } from "react";
import ReactMarkdown from "react-markdown";
// ExpandableMarkdown component for markdown notes with expand/collapse
interface ExpandableMarkdownProps {
  text: string;
  maxLength?: number;
}

export default function ExpandableMarkdown({
  text,
  maxLength = 100,
}: ExpandableMarkdownProps) {
  const [expanded, setExpanded] = useLocalState(false);
  const isLong = text.length > maxLength;
  const displayText =
    !expanded && isLong ? text.slice(0, maxLength) + "..." : text;
  return (
    <Box>
      <ReactMarkdown>{displayText}</ReactMarkdown>
      {isLong && (
        <Button
          size="xs"
          variant="link"
          colorScheme="blue"
          onClick={() => setExpanded((e) => !e)}
          mt={1}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}
    </Box>
  );
}
