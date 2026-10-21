import type { PlaybackSnapshot } from "@groovenet/player";

export function formatPlayback(snapshot: PlaybackSnapshot): string[] {
  const track = snapshot.current?.track;
  const title = track ? `${track.artist} — ${track.title}` : "Nothing playing";
  const metadata = track ? [track.bpm != null ? `${track.bpm} BPM` : null, track.key || null].filter(Boolean).join(" · ") : "";
  const position = formatTime(snapshot.position);
  const duration = snapshot.duration == null ? "--:--" : formatTime(snapshot.duration);
  const ratio = snapshot.duration && snapshot.duration > 0 ? Math.min(1, snapshot.position / snapshot.duration) : 0;
  const width = 24;
  const progress = `${"━".repeat(Math.round(ratio * width))}${"─".repeat(width - Math.round(ratio * width))}`;
  return [title, metadata, `${progress} ${position} / ${duration} · ${snapshot.status} · ${snapshot.volume}%`];
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}
