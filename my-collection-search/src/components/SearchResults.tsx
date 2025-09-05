import React, { useRef, useState } from "react";
import {
  Box,
  Input,
  Text,
  Button,
  Portal,
  Menu,
  InputGroup,
} from "@chakra-ui/react";
import TrackResult from "@/components/TrackResult";
import { Track } from "@/types/track";
import { FiMoreVertical } from "react-icons/fi";
import { LuSearch } from "react-icons/lu";
import UsernameSelect from "./UsernameSelect";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useSearchResults } from "@/hooks/useSearchResults";
import { useUsername } from "@/providers/UsernameProvider";
import { useMeili } from "@/providers/MeiliProvider";
import { usePlaylists } from "@/hooks/usePlaylists";
import { TrackEditFormProps } from "./TrackEditForm";
import { useTracksQuery } from "@/hooks/useTracksQuery";
import TrackEditDialog from "./TrackEditDialog";
import { toaster } from "./ui/toaster";

const SearchResults: React.FC = () => {
  const { friends } = useFriendsQuery({
    showCurrentUser: true,
    showSpotifyUsernames: true,
  });
  const { username: selectedUsername } = useUsername();
  const { client: meiliClient } = useMeili();
  const {
    query,
    onQueryChange,
    estimatedResults,
    results,
    playlistCounts,
    hasMore,
    loadMore,
    loading,
  } = useSearchResults({ client: meiliClient, username: selectedUsername });
  const { addToPlaylist } = usePlaylists();
  const { saveTrack } = useTracksQuery();
  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const lastResultRef = React.useRef<HTMLDivElement | null>(null);
  const observer = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    if (!hasMore) return;
    if (!lastResultRef.current) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    observer.current.observe(lastResultRef.current);
    return () => observer.current?.disconnect();
  }, [results, hasMore, loadMore]);

  // Debounced input state
  const [debouncedValue, setDebouncedValue] = React.useState(query);
  React.useEffect(() => {
    setDebouncedValue(query);
  }, [query]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedValue !== query) {
        // Only call if changed
        onQueryChange({
          target: { value: debouncedValue },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [debouncedValue, onQueryChange, query]);

  const handleSaveTrack = async (data: TrackEditFormProps) => {
    try {
      await saveTrack(data);
      setEditTrack(null);
      setDialogOpen(false);
      toaster.create({ title: "Updated track", type: "success" });
    } catch (error) {
      console.error("Failed to update track", error);
      toaster.create({ title: "Failed to update track", type: "error" });
    }
  };

  const handleEditClick = (track: Track) => {
    setEditTrack(track);
    setDialogOpen(true);
  };

  return (
    <>
      <Box>
        <Box display="flex" flexDirection={["column", "row"]} gap={3} mb={3}>
          <InputGroup startElement={<LuSearch size={16} />}>
            <Input
              placeholder="Search"
              value={debouncedValue}
              onChange={(e) => setDebouncedValue(e.target.value)}
              flex="1"
              variant={"subtle"}
              fontSize="16px"
            />
          </InputGroup>
          <UsernameSelect usernames={friends} />
        </Box>

        {loading ? (
          <Box mt={8}>
            {[...Array(8)].map((_, i) => (
              <Box key={i} mb={4}>
                <Box height="255px" borderRadius="md" bg="bg.muted" />
              </Box>
            ))}
          </Box>
        ) : (
          <>
            <Text fontSize="sm" color="gray.500" mb={2}>
              {estimatedResults.toLocaleString()} results found
            </Text>

            {results.map((track, idx) => {
              const isLast = idx === results.length - 1;
              const trackResult = (
                <TrackResult
                  key={`search-${track.id}`}
                  track={track}
                  allowMinimize={false}
                  playlistCount={playlistCounts[track.track_id]}
                  buttons={[
                    <Menu.Root key="menu">
                      <Menu.Trigger asChild>
                        <Button variant="plain" size={["xs", "sm", "md"]}>
                          <FiMoreVertical />
                        </Button>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content>
                            <Menu.Item
                              onSelect={() => addToPlaylist(track)}
                              value="add"
                            >
                              Add to Playlist
                            </Menu.Item>
                            <Menu.Item
                              onSelect={() => handleEditClick(track)}
                              value="edit"
                            >
                              Edit Track
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>,
                  ]}
                />
              );
              if (isLast) {
                return (
                  <Box ref={lastResultRef} key={track.track_id}>
                    {trackResult}
                  </Box>
                );
              }
              return trackResult;
            })}
          </>
        )}
        {/* End of results/infinite scroll */}
      </Box>
      <TrackEditDialog
        editTrack={editTrack}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        initialFocusRef={initialFocusRef}
        onSave={handleSaveTrack}
      />
    </>
  );
};

export default SearchResults;
