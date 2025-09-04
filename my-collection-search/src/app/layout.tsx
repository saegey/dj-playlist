// app/layout.tsx
import type { ReactNode } from "react";
import ClientProviders from "./providers"; // <- client wrapper

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}