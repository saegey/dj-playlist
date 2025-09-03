"use client";

import { useState } from "react";

import { Provider } from "@/components/ui/provider";
import { MeiliProvider } from "@/providers/MeiliProvider";
import { UsernameProvider } from "@/providers/UsernameProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => new QueryClient());

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <QueryClientProvider client={client}>
            <UsernameProvider>
              <MeiliProvider>{children}</MeiliProvider>
            </UsernameProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </Provider>
      </body>
    </html>
  );
}
