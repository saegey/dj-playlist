import { Provider } from "@/components/ui/provider";
import { MeiliProvider } from "@/providers/MeiliProvider";
import { UsernameProvider } from "@/providers/UsernameProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <UsernameProvider>
            <MeiliProvider>{children}</MeiliProvider>
          </UsernameProvider>
        </Provider>
      </body>
    </html>
  );
}
