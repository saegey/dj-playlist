// components/settings/FriendsDiscogsSection.tsx
"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Input,
  Button,
  Skeleton,
} from "@chakra-ui/react";
import { FiRefreshCcw, FiTrash } from "react-icons/fi";

import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useSyncDiscogs } from "@/hooks/useDiscogsQuery";
import { useFriendsSync } from "@/hooks/useFriendsSync"; // streams + opens RemoveFriendDialog

export default function FriendsDiscogsSection() {
  const [newFriend, setNewFriend] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Friends list + add/remove (React Query)
  const {
    friends,
    friendsLoading,
    addFriend,
    removeFriendPending, // (available if you want a global disable)
    addFriendPending,
  } = useFriendsQuery();

  // Discogs per-friend sync (streamed output handled by dialog/context)
  const discogsSync = useSyncDiscogs();

  // Removal with streamed progress + dialog
  const { handleRemoveFriend } = useFriendsSync();

  const startAddFriend = async () => {
    const u = newFriend.trim();
    if (!u) return;
    await addFriend(u);
    setNewFriend("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const disableAdd = addFriendPending;

  return (
    <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={2}>
        Friends&apos; Discogs Collections
      </Heading>
      <Text mb={2}>
        Add friends&apos; Discogs usernames to sync or browse their collections
        for playlist collaboration or borrowing albums.
      </Text>

      <HStack mb={4}>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add friend's username"
          value={newFriend}
          onChange={(e) => setNewFriend(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newFriend.trim() && !disableAdd) {
              startAddFriend();
            }
          }}
        />
        <Button
          colorScheme="green"
          onClick={startAddFriend}
          disabled={!newFriend.trim() || disableAdd}
          loading={addFriendPending}
        >
          Add
        </Button>
      </HStack>

      <VStack align="stretch">
        {friendsLoading ? (
          [...Array(3)].map((_, i) => (
            <HStack key={i} width="100%" justifyContent="space-between">
              <Skeleton height="20px" width="40%" />
              <HStack width="100%" justifyContent="flex-end" gap={2}>
                <Skeleton height="28px" width="48px" />
                <Skeleton height="28px" width="64px" />
              </HStack>
            </HStack>
          ))
        ) : friends.length === 0 ? (
          <Text color="gray.400">No friends added yet.</Text>
        ) : (
          friends.map((friend) => (
            <HStack
              key={friend.username}
              width="100%"
              justifyContent="space-between"
            >
              <Text fontWeight="medium">{friend.username}</Text>
              <HStack justifyContent="flex-end" flexGrow={1}>
                <Button
                  size="xs"
                  colorScheme="blue"
                  onClick={() =>
                    discogsSync.mutate({ username: friend.username })
                  }
                  loading={discogsSync.isPending}
                  disabled={discogsSync.isPending}
                  title="Sync Discogs"
                >
                  <FiRefreshCcw />
                </Button>
                <Button
                  size="xs"
                  colorPalette="red"
                  onClick={() => handleRemoveFriend(friend.username)} // opens dialog + streams
                  title="Remove friend"
                  disabled={removeFriendPending}
                >
                  <FiTrash />
                </Button>
              </HStack>
            </HStack>
          ))
        )}
      </VStack>
    </Box>
  );
}
