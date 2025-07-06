"use client";

import { useState } from "react";
import { Box, Button, Input, Textarea, Text, Stack } from "@chakra-ui/react";

export default function TrackEditForm({ track, onSave }: { track: any, onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    ...track,
    local_tags: track.local_tags || "",
    notes: track.notes || ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={4} borderWidth="1px" borderRadius="md" >
      <Stack spacing={3}>
        <Text fontWeight="bold">Edit Track Metadata</Text>
        <Input name="title" value={form.title} onChange={handleChange} placeholder="Title" isReadOnly />
        <Input name="artist" value={form.artist} onChange={handleChange} placeholder="Artist" isReadOnly />
        <Input name="album" value={form.album} onChange={handleChange} placeholder="Album" isReadOnly />
        <Input name="local_tags" value={form.local_tags} onChange={handleChange} placeholder="Tags (comma separated)" />
        <Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" />
        <Button type="submit" colorScheme="blue" isLoading={loading}>Save</Button>
      </Stack>
    </Box>
  );
}
