"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Provider as ChakraProvider } from "@/components/ui/provider";
import { MeiliProvider } from "@/providers/MeiliProvider";
import { UsernameProvider } from "@/providers/UsernameProvider";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import { PlaylistPlayerProvider } from "@/providers/PlaylistPlayerProvider";
import TrackEditProvider from "@/providers/TrackEditProvider";
import PlaylistsProvider from "@/providers/PlaylistsProvider";

const ReactQueryDevtools: React.ComponentType<{ initialIsOpen?: boolean }> =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then((m) => ({
            default: m.ReactQueryDevtools,
          })),
        { ssr: false }
      )
    : () => null;

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => new QueryClient());

  return (
    <ChakraProvider>
      <QueryClientProvider client={client}>
        <UsernameProvider>
          <MeiliProvider>
            <TrackEditProvider>
              <PlaylistsProvider>
                <PlaylistPlayerProvider>
                  {children}
                  <PlaylistPlayer />
                </PlaylistPlayerProvider>
              </PlaylistsProvider>
            </TrackEditProvider>
          </MeiliProvider>
        </UsernameProvider>
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ChakraProvider>
  );
}
