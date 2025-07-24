import * as React from "react";

export function useSelectedUsername(): [string, (username: string) => void] {
  const [selectedUsername, setSelectedUsername] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("selectedUsername") || "";
    }
    return "";
  });

  // Sync selection with localStorage (client only)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedUsername) {
      window.localStorage.setItem("selectedUsername", selectedUsername);
    } else {
      window.localStorage.removeItem("selectedUsername");
    }
  }, [selectedUsername]);

  // On mount, update state if localStorage has changed (client only)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("selectedUsername");
    if (stored && stored !== selectedUsername) {
      setSelectedUsername(stored);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [selectedUsername, setSelectedUsername];
}
