"use client";

import React from "react";
import { Box, Table, Badge, RatingGroup, Link, Icon, Flex } from "@chakra-ui/react";
import { Track } from "@/types/track";
import { SiDiscogs, SiApplemusic, SiYoutube, SiSpotify, SiSoundcloud } from "react-icons/si";
import { FaPlay } from "react-icons/fa";
import { keyToCamelot } from "@/lib/playlistOrder";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type TrackTableViewProps = {
  tracks: Track[];
  buttons?: (track: Track) => React.ReactNode;
};

export default function TrackTableView({
  tracks,
  buttons,
}: TrackTableViewProps) {
  const { replacePlaylist } = usePlaylistPlayer();

  return (
    <Box overflowX="auto">
      <Table.Root size="sm" variant="outline" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader width="40px"></Table.ColumnHeader>
            <Table.ColumnHeader width="80px">Library ID</Table.ColumnHeader>
            <Table.ColumnHeader>Title</Table.ColumnHeader>
            <Table.ColumnHeader>Artist</Table.ColumnHeader>
            <Table.ColumnHeader>Album</Table.ColumnHeader>
            <Table.ColumnHeader>Genre</Table.ColumnHeader>
            <Table.ColumnHeader>Duration</Table.ColumnHeader>
            <Table.ColumnHeader>BPM</Table.ColumnHeader>
            <Table.ColumnHeader>Key</Table.ColumnHeader>
            <Table.ColumnHeader>Rating</Table.ColumnHeader>
            <Table.ColumnHeader>User</Table.ColumnHeader>
            <Table.ColumnHeader>Links</Table.ColumnHeader>
            <Table.ColumnHeader width="60px"></Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tracks.map((track) => {
            const genres = Array.isArray(track.genres) ? track.genres : [];
            const styles = Array.isArray(track.styles) ? track.styles : [];
            const allGenres = [...genres, ...styles];

            return (
              <Table.Row key={track.track_id}>
                {/* Play button */}
                <Table.Cell>
                  {track.local_audio_url && (
                    <Icon
                      as={FaPlay}
                      boxSize={4}
                      cursor="pointer"
                      color="gray.600"
                      _hover={{ color: "gray.800" }}
                      onClick={() =>
                        replacePlaylist([track], { autoplay: true, startIndex: 0 })
                      }
                    />
                  )}
                </Table.Cell>

                {/* Library Identifier */}
                <Table.Cell>
                  {track.library_identifier ? (
                    <Badge colorPalette="blue" size="sm">
                      {track.library_identifier}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </Table.Cell>

                {/* Title */}
                <Table.Cell fontWeight="medium" maxW="300px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {track.title}
                </Table.Cell>

                {/* Artist */}
                <Table.Cell maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {track.artist}
                </Table.Cell>

                {/* Album */}
                <Table.Cell maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {track.album}
                </Table.Cell>

                {/* Genre */}
                <Table.Cell>
                  <Flex gap={1} flexWrap="wrap" maxW="200px">
                    {allGenres.slice(0, 2).map((genre, idx) => (
                      <Badge key={idx} size="xs" variant="subtle">
                        {genre}
                      </Badge>
                    ))}
                    {allGenres.length > 2 && (
                      <Badge size="xs" variant="outline">
                        +{allGenres.length - 2}
                      </Badge>
                    )}
                  </Flex>
                </Table.Cell>

                {/* Duration */}
                <Table.Cell>
                  {track.duration_seconds && track.duration_seconds > 0
                    ? formatSeconds(track.duration_seconds)
                    : "-"}
                </Table.Cell>

                {/* BPM */}
                <Table.Cell>{track.bpm || "-"}</Table.Cell>

                {/* Key */}
                <Table.Cell>
                  {track.key ? `${track.key} (${keyToCamelot(track.key)})` : "-"}
                </Table.Cell>

                {/* Rating */}
                <Table.Cell>
                  <RatingGroup.Root value={track.star_rating ?? 0} readOnly size="xs">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <RatingGroup.Item key={index} index={index + 1}>
                        <RatingGroup.ItemIndicator />
                      </RatingGroup.Item>
                    ))}
                  </RatingGroup.Root>
                </Table.Cell>

                {/* User */}
                <Table.Cell fontSize="xs" color="gray.600">
                  {track.username || "-"}
                </Table.Cell>

                {/* Links */}
                <Table.Cell>
                  <Flex gap={2}>
                    {track.discogs_url && (
                      <Link href={track.discogs_url} target="_blank" aria-label="Discogs">
                        <SiDiscogs size={16} />
                      </Link>
                    )}
                    {track.spotify_url && (
                      <Link href={track.spotify_url} target="_blank" aria-label="Spotify">
                        <SiSpotify size={16} />
                      </Link>
                    )}
                    {track.apple_music_url && (
                      <Link href={track.apple_music_url} target="_blank" aria-label="Apple Music">
                        <SiApplemusic size={16} />
                      </Link>
                    )}
                    {track.youtube_url && (
                      <Link href={track.youtube_url} target="_blank" aria-label="YouTube">
                        <SiYoutube size={16} />
                      </Link>
                    )}
                    {track.soundcloud_url && (
                      <Link href={track.soundcloud_url} target="_blank" aria-label="SoundCloud">
                        <SiSoundcloud size={16} />
                      </Link>
                    )}
                  </Flex>
                </Table.Cell>

                {/* Actions */}
                <Table.Cell>
                  {buttons && buttons(track)}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
