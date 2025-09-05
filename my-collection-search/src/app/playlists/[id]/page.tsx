import type { Metadata } from "next";

interface PlaylistPageProps {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata({ params }: PlaylistPageProps): Promise<Metadata> {
  return {
    title: `Playlist ${params.id}`,
  };
}

// This is a server component by default. Add 'use client' at the top if you need client-side interactivity.
export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = params;

  // Placeholder: you can fetch playlist details here later
  // const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/playlists/${id}`, { cache: 'no-store' });
  // const playlist = res.ok ? await res.json() : null;

  return (
    <main style={{ padding: '1rem', maxWidth: 960, margin: '0 auto' }}>
      <h1>Playlist {id}</h1>
      <p>This page is a placeholder. Implement playlist detail UI here.</p>
      {/* Future ideas:
          - Show playlist name, track count, total duration
          - Actions: play all, shuffle, export, edit name
          - Track list with drag reorder
       */}
    </main>
  );
}
