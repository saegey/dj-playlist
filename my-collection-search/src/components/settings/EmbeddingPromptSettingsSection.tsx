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
import {
  fetchEmbeddingPromptSettings,
  updateEmbeddingPromptSettings,
} from "@/services/internalApi/settings";

export default function EmbeddingPromptSettingsSection(): React.JSX.Element {
  const { friend, setFriend } = useUsername();
  const { friends, friendsLoading } = useFriendsQuery({
    showCurrentUser: true,
  });

  const [template, setTemplate] = React.useState("");
  const [defaultTemplate, setDefaultTemplate] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchEmbeddingPromptSettings({ friend_id: friend?.id });
        setTemplate(data.template || "");
        setDefaultTemplate(data.defaultTemplate || "");
        setIsDefault(Boolean(data.isDefault));
      } catch (err) {
        toaster.create({
          title: "Failed to load embedding template",
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
      const data = await updateEmbeddingPromptSettings({
        friend_id: friend.id,
        template,
      });
      setTemplate(data.template || template);
      setIsDefault(Boolean(data.isDefault));
      toaster.create({ title: "Embedding template saved", type: "success" });
    } catch (err) {
      toaster.create({
        title: "Failed to save embedding template",
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
      const data = await updateEmbeddingPromptSettings({
        friend_id: friend.id,
        template: "",
      });
      setTemplate(data.template || defaultTemplate);
      setIsDefault(true);
      toaster.create({ title: "Template reset to default", type: "success" });
    } catch (err) {
      toaster.create({
        title: "Failed to reset embedding template",
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
        Embedding Template
      </Heading>
      <Text color="gray.600" mb={4}>
        Customize the text template used to build vector embeddings per library.
        Available placeholders: {"{{title}}, {{artist}}, {{album}}, {{year}}, {{local_tags}}, {{styles}}, {{genres}}, {{key}}, {{bpm}}, {{danceability}}, {{mood_happy}}, {{mood_sad}}, {{mood_relaxed}}, {{mood_aggressive}}, {{notes}}"}.
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
            Using default template
          </Text>
        ) : (
          <Text fontSize="sm" color="green.600">
            Custom template active
          </Text>
        )}
      </Flex>

      <Textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        minH="180px"
        fontSize="sm"
        placeholder="Enter your embedding prompt template..."
      />

      <Flex gap={2} mt={3}>
        <Button colorScheme="blue" onClick={handleSave} loading={saving}>
          Save Template
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          Reset to Default
        </Button>
      </Flex>
    </Box>
  );
}
