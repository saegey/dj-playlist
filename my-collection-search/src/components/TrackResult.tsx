"use client";
import React, { useState } from "react";
import NextLink from "next/link";
import ArtistLink from "./ArtistLink";
import AlbumLink from "./AlbumLink";
import TrackPlaylistUsage from "./TrackPlaylistUsage";
import {
  Box,
  Flex,
  Grid,
  Text,
  Link,
  Image,
  Icon,
  RatingGroup,
  Badge,
  Checkbox,
  Popover,
} from "@chakra-ui/react";
import { Track } from "@/types/track";
import { FaPlay } from "react-icons/fa";
import { FiFileText, FiPlus } from "react-icons/fi";
import { keyToCamelot } from "@/lib/playlistOrder";
import { getTrackDurationSeconds } from "@/lib/trackUtils";
import {
  discogsGenreBadges,
  primaryGenreBadges,
  trackGenreBadges,
  type GenreBadgeItem,
} from "@/lib/genres/links";
import { useGenreLookup } from "@/hooks/useGenreTaxonomyQuery";
import { GenreBadgeList, type GenreBadgeKind } from "./GenreBadge";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { useTracksQuery } from "@/hooks/useTracksQuery";
import type { SortPositionChange } from "@/hooks/usePlaylistMutations";

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PLACEHOLDER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3Ctext fill='%23ffffff' font-family='Arial' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E";

// Artwork (left) and actions (right) sit outside the grid, as plain flex items that
// never shrink — the grid in between holds everything squeezable (title through
// rating) and is the only part allowed to clip when a row doesn't have full width.
// That guarantees the "more actions" menu is never pushed off-screen by a narrow
// container; the Rate/Genre/Key columns degrade instead.
export const TRACK_ROW_EDGE_WIDTH = "44px";
/** The grid every `layout="row"` track shares with `TrackListHeader`, so columns never drift apart. */
export const TRACK_ROW_GRID_TEMPLATE =
  "minmax(180px, 2.2fr) minmax(130px, 1.6fr) 32px 44px 56px 108px minmax(120px, 1.3fr) 76px";
export const TRACK_ROW_HEIGHT = 64;

export type TrackResultProps = {
  track: Track | (Track & { camelot_key?: string });
  buttons?: React.ReactNode;
  footer?: React.ReactNode;
  playlistCount?: number;
  showUsername?: boolean;
  showRating?: boolean;
  showDetails?: boolean;
  showGenres?: boolean;
  showNotes?: boolean;
  showPlaylistCount?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  /**
   * "card" (default): the artwork-forward card used everywhere a track is shown.
   * "row": the dense, grid-aligned desktop row used by the main search results
   * list (paired with `TrackListHeader`).
   */
  layout?: "row" | "card";
  /** "standard" (default) or the lower-height presentation used in jobs and queues. */
  density?: "standard" | "dense";
  /** Called when a dense row is clicked (used by the queue to play that track). */
  onRowClick?: () => void;
  sortPositionChange?: SortPositionChange;
};

/** Header for `layout="row"`: same column template as each row, rendered once above the list. */
export function TrackListHeader() {
  return (
    <Flex
      align="center"
      gap={4}
      height="36px"
      px={4}
      bg="bg.subtle"
      borderBottomWidth="1px"
      borderColor="border"
      fontSize="11px"
      lineHeight="16px"
      letterSpacing="0.08em"
      textTransform="uppercase"
      color="fg.muted"
      minW={0}
    >
      <Box aria-hidden="true" flexShrink={0} w={TRACK_ROW_EDGE_WIDTH} />
      <Grid templateColumns={TRACK_ROW_GRID_TEMPLATE} columnGap={4} alignItems="center" flex="1" minW={0} overflow="hidden">
        <Text>Track</Text>
        <Text>Album</Text>
        <Text>Side</Text>
        <Text textAlign="right">Time</Text>
        <Text textAlign="right">BPM</Text>
        <Text>Key</Text>
        <Text>Genre</Text>
        <Text>Rating</Text>
      </Grid>
      <Box aria-hidden="true" flexShrink={0} minW="80px" />
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

/** Camelot code bold, key name muted, optional dot coloured by wheel position. */
function KeyChip({ keyName, camelot }: { keyName?: string | null; camelot: string }) {
  if (!keyName || !camelot || camelot === "-") {
    return (
      <Text fontSize="sm" color="fg.subtle">
        —
      </Text>
    );
  }
  const wheelPosition = parseInt(camelot, 10) || 0;
  const hue = (wheelPosition * 30 + 150) % 360;
  return (
    <Flex
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      h="24px"
      px={2}
      borderRadius="sm"
      bg="bg.muted"
      borderWidth="1px"
      borderColor="border"
      whiteSpace="nowrap"
      minW={0}
    >
      <Box aria-hidden="true" boxSize="8px" borderRadius="full" bg={`hsl(${hue}, 70%, 62%)`} flexShrink={0} />
      <Text as="span" fontSize="xs" fontWeight="bold" color="fg" fontVariantNumeric="tabular-nums">
        {camelot}
      </Text>
      <Text as="span" fontSize="xs" color="fg.muted" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
        {keyName}
      </Text>
    </Flex>
  );
}

/** Bold, tabular-nums BPM; an orange "No BPM" badge when there's none. */
function BpmValue({ bpm, align = "right" }: { bpm?: string | number | null; align?: "left" | "right" }) {
  const num = typeof bpm === "number" ? bpm : parseFloat(bpm ?? "");
  const hasBpm = Number.isFinite(num) && num > 0;
  if (!hasBpm) {
    return (
      <Badge colorPalette="orange" variant="subtle" size="sm" whiteSpace="nowrap">
        No BPM
      </Badge>
    );
  }
  return (
    <Text fontSize="sm" fontWeight="semibold" fontVariantNumeric="tabular-nums" textAlign={align}>
      {num}
    </Text>
  );
}

/** Up to `max` purple-subtle genre badges, plus a "+N" overflow badge. */
function GenreList({
  items,
  kind,
  max = 2,
}: {
  items: GenreBadgeItem[];
  kind: GenreBadgeKind;
  max?: number;
}) {
  if (items.length === 0) return null;
  const shown = items.slice(0, max);
  const overflow = items.length - shown.length;
  return (
    <Flex gap={1.5} alignItems="center" overflow="hidden" minW={0} data-testid="track-genres">
      <GenreBadgeList items={shown} kind={kind} scope="tracks" colorPalette="purple" variant="subtle" />
      {overflow > 0 && (
        <Badge size="sm" variant="subtle" colorPalette="gray" flexShrink={0}>
          +{overflow}
        </Badge>
      )}
    </Flex>
  );
}

/** Star rating: hidden unless rated or the ancestor row/card carries the hover class. */
function RatingStars({
  value,
  onChange,
  size = "xs",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "xs" | "sm";
}) {
  const rated = value > 0;
  return (
    <RatingGroup.Root
      value={value}
      onValueChange={(details) => onChange(details.value)}
      count={5}
      size={size}
      className="track-result-rating"
      opacity={rated ? 1 : 0}
      transition="opacity 0.12s ease"
      aria-label={rated ? `Rated ${value} of 5` : "Not rated"}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <RatingGroup.Item key={index} index={index}>
          <RatingGroup.ItemIndicator />
        </RatingGroup.Item>
      ))}
    </RatingGroup.Root>
  );
}

/** The whole artwork is a real `<button aria-label="Play">`; a dark scrim + play icon on hover/focus. */
function ArtworkPlay({
  track,
  size,
  iconSize,
}: {
  track: Track;
  size: string | { base: string; md: string };
  iconSize: number;
}) {
  const [imageError, setImageError] = useState(false);
  const { replacePlaylist } = usePlaylistPlayer();

  React.useEffect(() => {
    setImageError(false);
  }, [track.track_id, track.audio_file_album_art_url, track.album_thumbnail]);

  const artworkSrc = imageError
    ? PLACEHOLDER_SRC
    : track.audio_file_album_art_url || track.album_thumbnail || PLACEHOLDER_SRC;

  if (!track.local_audio_url) {
    return (
      <Box position="relative" flexShrink={0} width={size} height={size} borderRadius="md" overflow="hidden">
        <Image
          src={artworkSrc}
          alt=""
          width="100%"
          height="100%"
          objectFit="cover"
          draggable={false}
          onError={() => setImageError(true)}
        />
      </Box>
    );
  }

  return (
    <Box
      as="button"
      aria-label="Play"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        replacePlaylist([track], { autoplay: true, startIndex: 0 });
      }}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      position="relative"
      flexShrink={0}
      width={size}
      height={size}
      borderRadius="md"
      overflow="hidden"
      p={0}
      border="none"
      bg="transparent"
      cursor="pointer"
      _hover={{ "& .artwork-play-scrim": { opacity: 1 } }}
      _focusVisible={{ "& .artwork-play-scrim": { opacity: 1 }, outline: "2px solid", outlineColor: "blue.500" }}
    >
      <Image
        src={artworkSrc}
        alt=""
        width="100%"
        height="100%"
        objectFit="cover"
        draggable={false}
        onError={() => setImageError(true)}
      />
      <Box
        className="artwork-play-scrim"
        position="absolute"
        inset={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="rgba(12, 12, 14, 0.55)"
        opacity={0}
        transition="opacity 0.15s ease"
        pointerEvents="none"
      >
        <Icon as={FaPlay} boxSize={iconSize} color="white" />
      </Box>
    </Box>
  );
}

/** Notes icon (yellow-400), shown only when the track actually has notes; click to read them. */
function NotesIndicator({ notes }: { notes: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Box
          as="button"
          display="inline-flex"
          alignItems="center"
          flexShrink={0}
          color="yellow.400"
          _hover={{ color: "yellow.300" }}
          aria-label="Has notes"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <FiFileText size={13} />
        </Box>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content maxW="320px">
          <Popover.Body>
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {notes}
            </Text>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

/** Quick "add to the play queue" action, revealed on row/card hover (`_hover`/`_focusWithin`). */
function AddToCrateButton({ track }: { track: Track }) {
  const { appendToQueue } = usePlaylistPlayer();
  return (
    <Box
      as="button"
      aria-label="Add to crate"
      className="track-result-quick-add"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        appendToQueue(track);
      }}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      opacity={0}
      transition="opacity 0.12s ease"
      display="flex"
      alignItems="center"
      justifyContent="center"
      w="36px"
      h="36px"
      borderRadius="md"
      border="none"
      bg="transparent"
      color="fg.muted"
      cursor="pointer"
      _hover={{ bg: "bg.muted", color: "fg" }}
    >
      <Icon as={FiPlus} boxSize={4} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// TrackResult
// ---------------------------------------------------------------------------

export default function TrackResult({
  track,
  buttons,
  footer,
  playlistCount,
  showUsername = true,
  showRating = true,
  showDetails = true,
  showGenres = true,
  showNotes = true,
  showPlaylistCount = true,
  isSelected,
  onToggleSelect,
  layout = "card",
  density = "standard",
  onRowClick,
  sortPositionChange,
}: TrackResultProps) {
  const [localRating, setLocalRating] = useState(track.star_rating ?? 0);
  const { saveTrack } = useTracksQuery();

  React.useEffect(() => {
    setLocalRating(track.star_rating ?? 0);
  }, [track.star_rating]);

  const trackHref = `/tracks/${encodeURIComponent(track.track_id)}?friend_id=${track.friend_id}`;
  const hasNotes = Boolean(track.notes?.trim());

  // Data quality indicators. `hasVectors === undefined` means the endpoint
  // didn't report it, not that the track lacks one.
  const missingEmbedding = track.hasVectors === false;
  const bpmNum = typeof track.bpm === "number" ? track.bpm : parseFloat(track.bpm as string);
  const hasBpm = Number.isFinite(bpmNum) && bpmNum > 0;
  const hasDataIssue = missingEmbedding || !hasBpm;

  const handleRatingChange = (value: number) => {
    setLocalRating(value);
    saveTrack({ track_id: track.track_id, friend_id: track.friend_id, star_rating: value });
  };

  const genreLookup = useGenreLookup();
  const genreBadges = primaryGenreBadges(track, genreLookup);
  const discogsGenres = discogsGenreBadges(track.album_genres ?? track.genres, genreLookup);
  const discogsStyles = discogsGenreBadges(track.album_styles ?? track.styles, genreLookup);
  const trackGenres = trackGenreBadges(track, genreLookup);

  const camelot = keyToCamelot(track.key);
  const durationSeconds = getTrackDurationSeconds(track);
  const score = track._semanticScore !== undefined ? track._semanticScore * 100 : undefined;

  const metaExtras: React.ReactNode[] = [];
  if (track.library_identifier) {
    metaExtras.push(
      <Badge key="lib" colorPalette="blue" size="sm" fontWeight="bold" flexShrink={0}>
        {track.library_identifier}
      </Badge>
    );
  }
  if (sortPositionChange) {
    metaExtras.push(
      <Badge key="sort" colorPalette="purple" size="sm" flexShrink={0}>
        #{sortPositionChange.currentPosition} was #{sortPositionChange.previousPosition}
      </Badge>
    );
  }
  // No separate "No embedding" badge: it has nowhere to go without crowding the
  // album cell (#TrackResult row-layout), and the red data-issue styling below
  // already flags it — missingEmbedding still drives hasDataIssue.
  if (showUsername && track.username) {
    metaExtras.push(
      <Text key="username" color="fg.subtle" flexShrink={0}>
        {track.username}
      </Text>
    );
  }
  if (showPlaylistCount && typeof playlistCount === "number" && playlistCount > 0) {
    metaExtras.push(<TrackPlaylistUsage key="playlists" track={track} count={playlistCount} />);
  }

  const containerHoverReveal = {
    "& .track-result-quick-add": { opacity: 1 },
    "& .track-result-rating": { opacity: 1 },
  };

  const stopRowEvent = (event: React.SyntheticEvent) => event.stopPropagation();

  if (density === "dense" && layout === "row") {
    return (
      <Flex
        data-testid="track-result-dense-row"
        role="group"
        aria-label={`Queue item: ${track.title} by ${track.artist}`}
        tabIndex={onRowClick ? 0 : undefined}
        onClick={onRowClick}
        onKeyDown={(event) => {
          if (onRowClick && event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onRowClick();
          }
        }}
        align="center"
        gap={3}
        py={1.25}
        px={1}
        mb={1}
        borderBottomWidth="1px"
        borderColor="border"
        width="100%"
        minW={0}
        cursor={onRowClick ? "pointer" : "default"}
        _hover={{ bg: "bg.muted", ...containerHoverReveal }}
        _focusVisible={{ outline: "2px solid", outlineColor: "accent.solid", outlineOffset: "-2px" }}
      >
        <Box flexShrink={0} width="48px" height="48px" display="flex" alignItems="center" justifyContent="center">
          {onToggleSelect ? (
            <Box onMouseDown={stopRowEvent}>
              <Checkbox.Root checked={isSelected} onChange={onToggleSelect}>
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            </Box>
          ) : (
            <ArtworkPlay track={track} size="48px" iconSize={5} />
          )}
        </Box>
        <Flex direction="column" flex="1" minW={0}>
          <Flex align="center" gap={1.5} minW={0}>
            <Link
              as={NextLink}
              href={trackHref}
              onClick={stopRowEvent}
              onMouseDown={stopRowEvent}
              fontSize="sm"
              fontWeight="semibold"
              lineHeight="1.2"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              minW={0}
              _hover={{ textDecoration: "underline" }}
            >
              {track.title}
            </Link>
            {hasNotes && showNotes && <NotesIndicator notes={track.notes as string} />}
            {showRating && (
              <Box flexShrink={0} onClick={stopRowEvent} onMouseDown={stopRowEvent}>
                <RatingStars value={localRating} onChange={handleRatingChange} />
              </Box>
            )}
          </Flex>
          <Flex gap={1.5} align="center" minW={0} overflow="hidden" fontSize="xs" color="fg.muted">
            <ArtistLink artist={track.artist} friendId={track.friend_id}>
              <Text as="span" onClick={stopRowEvent} onMouseDown={stopRowEvent} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {track.artist}
              </Text>
            </ArtistLink>
            <Text aria-hidden="true" color="fg.subtle">·</Text>
            <AlbumLink releaseId={track.release_id} friendId={track.friend_id}>
              <Text as="span" onClick={stopRowEvent} onMouseDown={stopRowEvent} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {track.album}
              </Text>
            </AlbumLink>
            {showUsername && track.username && <Text flexShrink={0} color="fg.subtle">{track.username}</Text>}
            {showPlaylistCount && typeof playlistCount === "number" && playlistCount > 0 && (
              <Box flexShrink={0} onClick={stopRowEvent} onMouseDown={stopRowEvent}>
                <TrackPlaylistUsage track={track} count={playlistCount} />
              </Box>
            )}
          </Flex>
          {showGenres && (discogsGenres.length > 0 || discogsStyles.length > 0 || trackGenres.length > 0) && (
            <Flex gap={1.5} alignItems="center" flexWrap="nowrap" overflow="hidden" data-testid="track-genres" onClick={stopRowEvent} onMouseDown={stopRowEvent}>
              <GenreBadgeList items={discogsGenres.slice(0, 4)} kind="discogs-genre" scope="tracks" size="xs" />
              <GenreBadgeList items={discogsStyles.slice(0, 4)} kind="discogs-style" scope="tracks" size="xs" />
              <GenreBadgeList items={trackGenres} kind="track" scope="tracks" size="xs" colorPalette="blue" />
            </Flex>
          )}
        </Flex>
        {showDetails && durationSeconds ? (
          <Text fontSize="xs" color="fg.muted" flexShrink={0} fontVariantNumeric="tabular-nums">
            {formatSeconds(durationSeconds)}
          </Text>
        ) : null}
        <Flex align="center" gap={1} flexShrink={0} onClick={stopRowEvent} onMouseDown={stopRowEvent}>
          {buttons}
          <AddToCrateButton track={track} />
        </Flex>
      </Flex>
    );
  }

  if (density === "dense") {
    return (
      <Flex
        data-testid="track-result-dense-card"
        borderWidth={[0, "1px"]}
        borderBottomWidth="1px"
        borderRadius={[0, "md"]}
        p={[2, 3]}
        mb={2}
        gap={3}
        width="100%"
        minW={0}
        borderColor={isSelected ? "blue.500" : undefined}
        _hover={{ bg: "bg.muted", ...containerHoverReveal }}
        _focusWithin={containerHoverReveal}
      >
        {onToggleSelect && (
          <Box flexShrink={0} alignSelf="center">
            <Checkbox.Root checked={isSelected} onChange={onToggleSelect}>
              <Checkbox.HiddenInput />
              <Checkbox.Control />
            </Checkbox.Root>
          </Box>
        )}
        <ArtworkPlay track={track} size={{ base: "60px", md: "80px" }} iconSize={6} />
        <Flex direction="column" flex={1} minW={0} gap={1}>
          <Flex alignItems="center" gap={1.5} minW={0}>
            <Link
              as={NextLink}
              href={trackHref}
              title={track.title}
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="bold"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              minW={0}
              _hover={{ textDecoration: "underline" }}
            >
              {track.title}
            </Link>
            {hasNotes && showNotes && <NotesIndicator notes={track.notes as string} />}
            {score !== undefined && (
              <Badge colorPalette={score > 90 ? "green" : score > 75 ? "yellow" : "red"} size="xs" flexShrink={0}>
                {score.toFixed(0)}%
              </Badge>
            )}
            {showRating && <RatingStars value={localRating} onChange={handleRatingChange} />}
          </Flex>
          <Flex gap={1.5} fontSize="sm" color="fg.muted" flexWrap="wrap" alignItems="center" minW={0}>
            <ArtistLink artist={track.artist} friendId={track.friend_id} />
            <Text aria-hidden="true" color="fg.subtle">·</Text>
            <AlbumLink releaseId={track.release_id} friendId={track.friend_id}>
              <Text as="span">{track.album}{track.year ? ` (${track.year})` : ""}</Text>
            </AlbumLink>
            {showUsername && track.username && <Text fontSize="xs" color="fg.subtle">{track.username}</Text>}
            {showPlaylistCount && typeof playlistCount === "number" && playlistCount > 0 && (
              <TrackPlaylistUsage track={track} count={playlistCount} />
            )}
          </Flex>
          {showDetails && (
            <Flex gap={3} fontSize="xs" color="fg.muted" flexWrap="wrap" alignItems="center">
              {track.position && <Text>{track.position}</Text>}
              {durationSeconds && <Text fontVariantNumeric="tabular-nums">{formatSeconds(durationSeconds)}</Text>}
              {track.bpm && <Text>{track.bpm} BPM</Text>}
              {track.key && <Text>{track.key} ({camelot})</Text>}
              {track.danceability && <Text>{track.danceability}</Text>}
            </Flex>
          )}
          {showGenres && (discogsGenres.length > 0 || discogsStyles.length > 0 || trackGenres.length > 0) && (
            <Flex gap={1.5} alignItems="center" flexWrap="wrap" data-testid="track-genres">
              <GenreBadgeList items={discogsGenres.slice(0, 4)} kind="discogs-genre" scope="tracks" size="xs" />
              <GenreBadgeList items={discogsStyles.slice(0, 4)} kind="discogs-style" scope="tracks" size="xs" />
              <GenreBadgeList items={trackGenres} kind="track" scope="tracks" size="xs" colorPalette="blue" />
            </Flex>
          )}
          {footer && <Box mt={1}>{footer}</Box>}
        </Flex>
        <Flex direction="column" alignItems="center" gap={0.5} flexShrink={0}>
          {buttons}
          <AddToCrateButton track={track} />
        </Flex>
      </Flex>
    );
  }

  if (layout === "row") {
    return (
      <Flex
        align="center"
        gap={4}
        height={`${TRACK_ROW_HEIGHT}px`}
        px={4}
        minW={0}
        borderBottomWidth="1px"
        borderBottomColor="border"
        borderLeftWidth={hasDataIssue ? "3px" : undefined}
        borderLeftColor={hasDataIssue ? "red.400" : undefined}
        bg={hasDataIssue ? "red.50" : isSelected ? "blue.subtle" : undefined}
        _dark={{ bg: hasDataIssue ? "red.900" : isSelected ? "blue.subtle" : undefined }}
        _hover={{ bg: hasDataIssue ? undefined : "bg.muted", ...containerHoverReveal }}
        _focusWithin={containerHoverReveal}
      >
        <Box flexShrink={0} w={TRACK_ROW_EDGE_WIDTH}>
          {onToggleSelect ? (
            <Box onClick={(e) => e.stopPropagation()}>
              <Checkbox.Root checked={isSelected} onChange={onToggleSelect}>
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            </Box>
          ) : (
            <ArtworkPlay track={track} size="44px" iconSize={5} />
          )}
        </Box>

        {/*
          Everything squeezable lives in this grid, which is the only part allowed to
          clip (via its own overflow:hidden) when the row doesn't have full width. The
          artwork above and the actions below are plain flex items with no flex-shrink,
          so the "more actions" menu is never pushed off-screen by a narrow container.
        */}
        <Grid
          data-testid="track-row-grid"
          templateColumns={TRACK_ROW_GRID_TEMPLATE}
          columnGap={4}
          alignItems="center"
          flex="1"
          minW={0}
          overflow="hidden"
        >
          <Flex direction="column" gap={0.5} minW={0} overflow="hidden">
            <Flex alignItems="center" gap={1.5} minW={0}>
              <Link
                as={NextLink}
                href={trackHref}
                title={track.title}
                fontSize="15px"
                lineHeight="20px"
                fontWeight="600"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                minW={0}
                _hover={{ textDecoration: "underline" }}
              >
                {track.title}
              </Link>
              {hasNotes && showNotes && <NotesIndicator notes={track.notes as string} />}
              {score !== undefined && (
                <Badge colorPalette={score > 90 ? "green" : score > 75 ? "yellow" : "red"} size="sm" flexShrink={0}>
                  {score.toFixed(1)}%
                </Badge>
              )}
            </Flex>
            <ArtistLink artist={track.artist} friendId={track.friend_id}>
              <Text
                fontSize="13px"
                lineHeight="18px"
                fontWeight="500"
                color="fg.muted"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                title={track.artist}
              >
                {track.artist}
              </Text>
            </ArtistLink>
          </Flex>

          <Flex minW={0} fontSize="13px" color="fg.muted" alignItems="center" gap={1.5} overflow="hidden">
            <AlbumLink releaseId={track.release_id} friendId={track.friend_id}>
              <Text as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={track.album}>
                {track.album}
                {track.year && <Text as="span" color="fg.subtle"> · {track.year}</Text>}
              </Text>
            </AlbumLink>
            {metaExtras.length > 0 && (
              <Flex gap={1} flexShrink={0} align="center">
                {metaExtras}
              </Flex>
            )}
          </Flex>

          <Text fontSize="xs" color="fg.subtle">
            {track.position ?? ""}
          </Text>

          {showDetails ? (
            <Text fontSize="sm" color="fg.muted" textAlign="right" fontVariantNumeric="tabular-nums">
              {durationSeconds ? formatSeconds(durationSeconds) : ""}
            </Text>
          ) : (
            <Box />
          )}

          {showDetails ? (
            <Flex justifyContent="flex-end">
              <BpmValue bpm={track.bpm} />
            </Flex>
          ) : (
            <Box />
          )}

          {showDetails ? <KeyChip keyName={track.key} camelot={camelot} /> : <Box />}

          {/*
            A Grid child that renders null (GenreList, for a track with no genres)
            removes the DOM node entirely, which shifts every later child left by
            one track in CSS Grid's auto-placement — this Box always renders so
            the genre cell keeps its slot in the template regardless.
          */}
          <Box minW={0} overflow="hidden">
            {showGenres && <GenreList items={genreBadges.items} kind={genreBadges.kind} max={2} />}
          </Box>

          <Flex gap={0.5} justifyContent="flex-start" minW={0}>
            {showRating && <RatingStars value={localRating} onChange={handleRatingChange} />}
          </Flex>
        </Grid>

        <Flex flexShrink={0} alignItems="center" justifyContent="flex-end" gap={1}>
          <AddToCrateButton track={track} />
          {buttons}
        </Flex>
      </Flex>
    );
  }

  // ---- CARD layout (default) ----
  return (
    <Flex
      borderWidth="1px"
      borderLeftWidth={hasDataIssue ? "3px" : "1px"}
      borderLeftColor={hasDataIssue ? "red.400" : undefined}
      borderColor={isSelected ? "blue.500" : undefined}
      borderRadius="md"
      p={3}
      gap={3}
      // Most callers stack these in a plain .map() with no wrapper gap (genres,
      // related tracks, playlist/queue views) and rely on the card to space
      // itself, same as before the redesign. A caller with its own wrapper gap
      // (the search results card grid) cancels this out with rowGap={0}.
      mb={3}
      width="100%"
      minW={0}
      bg={hasDataIssue ? "red.50" : undefined}
      _dark={{ bg: hasDataIssue ? "red.900" : undefined }}
      _hover={{ bg: hasDataIssue ? undefined : "bg.muted", ...containerHoverReveal }}
      _focusWithin={containerHoverReveal}
    >
      {onToggleSelect && (
        <Box flexShrink={0} alignSelf="center" onClick={(e) => e.stopPropagation()}>
          <Checkbox.Root checked={isSelected} onChange={onToggleSelect}>
            <Checkbox.HiddenInput />
            <Checkbox.Control />
          </Checkbox.Root>
        </Box>
      )}

      <ArtworkPlay track={track} size={{ base: "64px", md: "96px" }} iconSize={7} />

      <Flex direction="column" flex={1} minW={0} gap={1.5}>
        <Flex direction="column" gap="1px" minW={0}>
          <Flex alignItems="center" gap={1.5} minW={0}>
            <Link
              as={NextLink}
              href={trackHref}
              title={track.title}
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="700"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              minW={0}
              _hover={{ textDecoration: "underline" }}
            >
              {track.title}
            </Link>
            {hasNotes && showNotes && <NotesIndicator notes={track.notes as string} />}
            {score !== undefined && (
              <Badge colorPalette={score > 90 ? "green" : score > 75 ? "yellow" : "red"} size="sm" flexShrink={0}>
                {score.toFixed(1)}%
              </Badge>
            )}
          </Flex>
          <ArtistLink artist={track.artist} friendId={track.friend_id}>
            <Text
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="500"
              color="fg.muted"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              title={track.artist}
            >
              {track.artist}
            </Text>
          </ArtistLink>
          <Flex gap={1} fontSize="xs" color="fg.subtle" alignItems="center" minW={0} overflow="hidden">
            <AlbumLink releaseId={track.release_id} friendId={track.friend_id}>
              <Text as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={track.album}>
                {track.album}
                {track.year && ` · ${track.year}`}
              </Text>
            </AlbumLink>
          </Flex>
        </Flex>

        {showDetails && (
          <Flex alignItems="center" gap={2} flexWrap="wrap">
            <BpmValue bpm={track.bpm} align="left" />
            <KeyChip keyName={track.key} camelot={camelot} />
            {durationSeconds && (
              <Text fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
                {formatSeconds(durationSeconds)}
              </Text>
            )}
            {track.position && (
              <Text fontSize="xs" color="fg.subtle">
                {track.position}
              </Text>
            )}
            {metaExtras}
          </Flex>
        )}

        <Flex alignItems="center" justifyContent="space-between" gap={2} minW={0}>
          {showGenres && <GenreList items={genreBadges.items} kind={genreBadges.kind} max={2} />}
          {showRating && (
            <Box flexShrink={0}>
              <RatingStars value={localRating} onChange={handleRatingChange} />
            </Box>
          )}
        </Flex>

        {footer && <Box mt={1}>{footer}</Box>}
      </Flex>

      {/*
        A real flex sibling, not position:absolute over the title — an absolutely
        positioned cluster needs a manually guessed reserve (e.g. padding-right) on
        the title to avoid overlap, which breaks for any title/button width it
        didn't anticipate. flexShrink:0 here guarantees the reserved space instead.
      */}
      <Flex direction="column" alignItems="center" gap={0.5} flexShrink={0}>
        {buttons}
        <AddToCrateButton track={track} />
      </Flex>
    </Flex>
  );
}
