"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ChakraProvider } from "@/components/ui/provider";
import { MeiliProvider } from "@/providers/MeiliProvider";
import { UsernameProvider } from "@/providers/UsernameProvider";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import { PlaylistPlayerProvider } from "@/providers/PlaylistPlayerProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <ChakraProvider>
      <QueryClientProvider client={client}>
        <UsernameProvider>
          {/* Make BOTH pages and the player share the same app providers */}
          <MeiliProvider>
            <PlaylistPlayerProvider>
              {children}
              {/* Fixed bottom player renders once at root, available everywhere */}
              <PlaylistPlayer />
            </PlaylistPlayerProvider>
          </MeiliProvider>
        </UsernameProvider>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </ChakraProvider>
  );
}