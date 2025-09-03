import React, { useState, useRef } from "react";
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
import AddFriendDialog from "./AddFriendDialog";
import { FiRefreshCcw, FiTrash } from "react-icons/fi";

interface FriendsDiscogsSectionProps {
  friends: string[];
  friendsLoading: boolean;
  newFriend: string;
  setNewFriend: (v: string) => void;
  handleAddFriend: (onProgress?: (msg: string) => void) => void;
  handleRemoveFriend: (username: string) => void;
  handleSync: (username: string) => void;
  syncing: { [username: string]: boolean };
  indexing: boolean;
  initialLoad: boolean;
}

const FriendsDiscogsSection: React.FC<FriendsDiscogsSectionProps> = ({
  friends,
  friendsLoading,
  newFriend,
  setNewFriend,
  handleAddFriend,
  handleRemoveFriend,
  handleSync,
  syncing,
  indexing,
  initialLoad,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startAddFriend = async () => {
    setProgressMessages([]);
    setAddDialogOpen(true);
    setAdding(true);
    await handleAddFriend((msg) => {
      setProgressMessages((prev) => [...prev, msg]);
    });
    setAdding(false);
  };

  const closeDialog = () => {
    setAddDialogOpen(false);
    setProgressMessages([]);
    setAdding(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <>
      <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
        <Heading size="md" mb={2}>
          Friends&apos; Discogs Collections
        </Heading>
        <Text mb={2}>
          Add friends&apos; Discogs usernames to sync or browse their
          collections for playlist collaboration or borrowing albums.
        </Text>
        <HStack mb={4}>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Add friend's username"
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFriend.trim()) startAddFriend();
            }}
          />
          <Button
            colorScheme="green"
            onClick={startAddFriend}
            disabled={!newFriend.trim()}
          >
            Add
          </Button>
        </HStack>
        <VStack align="stretch">
          {initialLoad || friendsLoading ? (
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
            friends.map((username) => (
              <HStack
                key={username}
                width="100%"
                justifyContent="space-between"
              >
                <Text fontWeight="medium">{username}</Text>
                <HStack justifyContent="flex-end" width="100%">
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={() => handleSync(username)}
                    loading={!!syncing[username]}
                    disabled={!!syncing[username] || indexing}
                  >
                    <FiRefreshCcw />
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="red"
                    // variant="outline"
                    onClick={() => handleRemoveFriend(username)}
                  >
                    <FiTrash />
                  </Button>
                </HStack>
              </HStack>
            ))
          )}
        </VStack>

        <AddFriendDialog
          open={addDialogOpen}
          onClose={closeDialog}
          progressMessages={progressMessages}
          loading={adding}
        />
      </Box>
    </>
  );
};

export default FriendsDiscogsSection;
