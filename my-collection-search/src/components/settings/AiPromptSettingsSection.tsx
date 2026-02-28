"use client";

import React from "react";
import {
  Box,
  Heading,
  Text,
  Textarea,
  Button,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useUsername } from "@/providers/UsernameProvider";
import UsernameSelect from "@/components/UsernameSelect";
import { toaster } from "@/components/ui/toaster";

export default function AiPromptSettingsSection(): React.JSX.Element {
  const { friend, setFriend } = useUsername();
  const { friends, friendsLoading } = useFriendsQuery({
    showCurrentUser: true,
  });

  const [prompt, setPrompt] = React.useState("");
  const [defaultPrompt, setDefaultPrompt] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const friendId = friend?.id;
        const url = friendId
          ? `/api/settings/ai-prompt?friend_id=${encodeURIComponent(friendId)}`
          : "/api/settings/ai-prompt";
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load prompt");
        }
        setPrompt(data.prompt || "");
        setDefaultPrompt(data.defaultPrompt || "");
        setIsDefault(Boolean(data.isDefault));
      } catch (err) {
        toaster.create({
          title: "Failed to load AI prompt",
          description: err instanceof Error ? err.message : String(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [friend?.id]);

  const handleSave = async () => {
    if (!friend?.id) {
      toaster.create({
        title: "Select a library first",
        type: "warning",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai-prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friend.id, prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save prompt");
      }
      setPrompt(data.prompt || prompt);
      setIsDefault(Boolean(data.isDefault));
      toaster.create({ title: "Prompt saved", type: "success" });
    } catch (err) {
      toaster.create({
        title: "Failed to save prompt",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!friend?.id) {
      toaster.create({
        title: "Select a library first",
        type: "warning",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai-prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friend.id, prompt: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to reset prompt");
      }
      setPrompt(data.prompt || defaultPrompt);
      setIsDefault(true);
      toaster.create({ title: "Prompt reset to default", type: "success" });
    } catch (err) {
      toaster.create({
        title: "Failed to reset prompt",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box mt={8}>
      <Heading size="lg" mb={2}>
        AI Metadata Prompt
      </Heading>
      <Text color="gray.600" mb={4}>
        Customize the system prompt used for track metadata generation. This is
        stored per library.
      </Text>

      <Flex gap={3} align="center" mb={4} flexWrap="wrap">
        <Box minW="240px">
          <UsernameSelect
            usernames={friends}
            includeAllOption={false}
            onChange={(friendId) => {
              const selected = friends.find((f) => f.id === friendId) || null;
              setFriend(selected);
            }}
            value={friend ?? null}
            isLoading={friendsLoading}
            size="md"
          />
        </Box>
        {loading && <Spinner size="sm" />}
        {isDefault ? (
          <Text fontSize="sm" color="gray.500">
            Using default prompt
          </Text>
        ) : (
          <Text fontSize="sm" color="green.600">
            Custom prompt active
          </Text>
        )}
      </Flex>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        minH="160px"
        fontSize="sm"
        placeholder="Enter your AI system prompt..."
      />

      <Flex gap={2} mt={3}>
        <Button colorScheme="blue" onClick={handleSave} loading={saving}>
          Save Prompt
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          Reset to Default
        </Button>
      </Flex>
    </Box>
  );
}
