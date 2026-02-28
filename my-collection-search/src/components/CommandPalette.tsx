"use client";

import React from "react";
import { Command } from "cmdk";
import * as RadixDialog from "@radix-ui/react-dialog";
import { useRouter, usePathname } from "next/navigation";
import { useUsername } from "@/providers/UsernameProvider";
import { usePlaylistsQuery } from "@/hooks/usePlaylistsQuery";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { importPlaylist } from "@/services/playlistService";
import type { Track } from "@/types/track";
import { toaster } from "@/components/ui/toaster";
import styles from "./CommandPalette.module.css";

type TrackHit = Track;

const NAV_ITEMS = [
  { href: "/", label: "Tracks" },
  { href: "/albums", label: "Albums" },
  { href: "/albums/add", label: "Add Album" },
  { href: "/playlists", label: "Playlists" },
  { href: "/missing-apple-music", label: "Match" },
  { href: "/backfill-audio", label: "Audio" },
  { href: "/bulk-notes", label: "Metadata" },
  { href: "/jobs", label: "Jobs" },
  { href: "/settings", label: "Settings" },
];

const isEditableTarget = (el: EventTarget | null) => {
  if (!el || !(el as HTMLElement).closest) return false;
  const node = el as HTMLElement;
  return !!node.closest("input, textarea, [contenteditable='true']");
};

export default function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { friend } = useUsername();
  const { playlists } = usePlaylistsQuery({ enabled: true });
  const {
    playlist,
    playlistLength,
    isPlaying,
    play,
    pause,
    playNext,
    playPrev,
    clearQueue,
    replacePlaylist,
  } = usePlaylistPlayer();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [trackHits, setTrackHits] = React.useState<TrackHit[]>([]);
  const [loadingTracks, setLoadingTracks] = React.useState(false);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
  }, [open]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!open) return;
      const q = query.trim();
      if (q.length === 0) {
        setTrackHits([]);
        return;
      }
      setLoadingTracks(true);
      try {
        const params = new URLSearchParams({
          q,
          limit: "8",
          offset: "0",
        });
        if (friend?.id) {
          params.set("filter", `friend_id = ${friend.id}`);
        }
        const response = await fetch(`/api/tracks/search?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Command palette search failed");
        const res = (await response.json()) as { hits?: TrackHit[] };
        if (cancelled) return;
        setTrackHits(res.hits ?? []);
      } catch (err) {
        console.error("Command palette track search error:", err);
        if (!cancelled) setTrackHits([]);
      } finally {
        if (!cancelled) setLoadingTracks(false);
      }
    };

    const handle = setTimeout(run, 180);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, query, friend?.id]);

  const filteredPlaylists = React.useMemo(() => {
    const playlistItems = Array.isArray(playlists) ? playlists : [];
    const q = query.trim().toLowerCase();
    if (!q) return playlistItems.slice(0, 8);
    return playlistItems
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [playlists, query]);

  const handleCreatePlaylistFromQueue = React.useCallback(async () => {
    if (!playlist || playlist.length === 0) {
      toaster.create({
        title: "Queue is empty",
        description: "Add tracks to the player queue first.",
        type: "info",
      });
      return;
    }
    const name = window.prompt("New playlist name");
    if (!name || !name.trim()) return;

    const tracks = playlist
      .filter((t) => t.track_id && typeof t.friend_id === "number")
      .map((t) => ({ track_id: t.track_id, friend_id: t.friend_id }));
    if (tracks.length === 0) {
      toaster.create({
        title: "No valid tracks in queue",
        type: "error",
      });
      return;
    }

    try {
      const res = await importPlaylist(name.trim(), tracks);
      if (!res.ok) throw new Error("Failed to create playlist");
      const created = await res.json();
      toaster.create({
        title: "Playlist created",
        description: name.trim(),
        type: "success",
      });
      if (created?.id) {
        router.push(`/playlists/${created.id}`);
      } else {
        router.push("/playlists");
      }
    } catch (err) {
      console.error("Failed to create playlist from queue:", err);
      toaster.create({ title: "Failed to create playlist", type: "error" });
    }
  }, [playlist, router]);

  const onNavigate = (href: string) => {
    if (pathname === href) {
      close();
      return;
    }
    router.push(href);
    close();
  };

  const onOpenTrack = (track: TrackHit) => {
    router.push(
      `/tracks/${encodeURIComponent(track.track_id)}?friend_id=${track.friend_id}`
    );
    close();
  };

  const onPlayTrack = (track: TrackHit) => {
    replacePlaylist([track], { autoplay: true, startIndex: 0 });
    close();
  };

  const onOpenPlaylist = (id?: number) => {
    if (!id) return;
    router.push(`/playlists/${id}`);
    close();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      overlayClassName={styles.overlay}
      className={styles.dialog}
      label="Command Palette"
    >
      <RadixDialog.Title className={styles.srOnly}>
        Command Palette
      </RadixDialog.Title>
      <Command className={styles.command}>
        <Command.Input
          autoFocus
          placeholder="Search tracks, playlists, or actions…"
          value={query}
          onValueChange={setQuery}
          className={styles.input}
        />
        <Command.List className={styles.list}>
          <Command.Empty className={styles.empty}>
            {loadingTracks ? "Searching…" : "No results."}
          </Command.Empty>

          <Command.Group heading="Navigation" className={styles.group}>
            {NAV_ITEMS.map((item) => (
              <Command.Item
                key={item.href}
                value={item.label}
                onSelect={() => onNavigate(item.href)}
                className={styles.item}
              >
                <div className={styles.itemLabel}>
                  <span className={styles.itemTitle}>{item.label}</span>
                  <span className={styles.itemMeta}>{item.href}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className={styles.separator} />

          <Command.Group heading="Player" className={styles.group}>
            <Command.Item
              value="Play/Pause"
              onSelect={() => {
                if (isPlaying) pause();
                else play();
                close();
              }}
              className={styles.item}
            >
              <span className={styles.itemTitle}>
                {isPlaying ? "Pause" : "Play"}
              </span>
              <span className={styles.shortcut}>Space</span>
            </Command.Item>
            <Command.Item
              value="Next track"
              onSelect={() => {
                playNext();
                close();
              }}
              className={styles.item}
            >
              <span className={styles.itemTitle}>Next Track</span>
            </Command.Item>
            <Command.Item
              value="Previous track"
              onSelect={() => {
                playPrev();
                close();
              }}
              className={styles.item}
            >
              <span className={styles.itemTitle}>Previous Track</span>
            </Command.Item>
            <Command.Item
              value="Clear queue"
              onSelect={() => {
                clearQueue();
                close();
              }}
              className={styles.item}
            >
              <span className={styles.itemTitle}>Clear Queue</span>
            </Command.Item>
            <Command.Item
              value="Create playlist from queue"
              onSelect={() => {
                handleCreatePlaylistFromQueue();
                close();
              }}
              className={styles.item}
            >
              <div className={styles.itemLabel}>
                <span className={styles.itemTitle}>
                  Create Playlist From Queue
                </span>
                <span className={styles.itemMeta}>
                  {playlistLength} tracks in queue
                </span>
              </div>
            </Command.Item>
          </Command.Group>

          <Command.Separator className={styles.separator} />

          <Command.Group heading="Playlists" className={styles.group}>
            {filteredPlaylists.map((pl) => (
              <Command.Item
                key={`pl-${pl.id}`}
                value={pl.name}
                onSelect={() => onOpenPlaylist(pl.id)}
                className={styles.item}
              >
                <div className={styles.itemLabel}>
                  <span className={styles.itemTitle}>{pl.name}</span>
                  <span className={styles.itemMeta}>
                    {pl.tracks?.length ?? 0} tracks
                  </span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className={styles.separator} />

          <Command.Group heading="Tracks" className={styles.group}>
            {trackHits.map((track) => (
              <React.Fragment key={`tr-${track.track_id}-${track.friend_id}`}>
                <Command.Item
                  value={`open ${track.title} ${track.artist} ${track.album}`}
                  onSelect={() => onOpenTrack(track)}
                  className={styles.item}
                >
                  <div className={styles.itemLabel}>
                    <span className={styles.itemTitle}>
                      {track.title || track.track_id}
                    </span>
                    <span className={styles.itemMeta}>
                      Open Track · {track.artist} · {track.album}
                    </span>
                  </div>
                </Command.Item>
                <Command.Item
                  value={`play ${track.title} ${track.artist} ${track.album}`}
                  onSelect={() => onPlayTrack(track)}
                  className={styles.item}
                >
                  <div className={styles.itemLabel}>
                    <span className={styles.itemTitle}>
                      Play: {track.title || track.track_id}
                    </span>
                    <span className={styles.itemMeta}>
                      Play Now · {track.artist} · {track.album}
                    </span>
                  </div>
                </Command.Item>
              </React.Fragment>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </Command.Dialog>
  );
}
