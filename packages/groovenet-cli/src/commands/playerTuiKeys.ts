export interface TuiKey {
  return?: boolean;
  escape?: boolean;
  backspace?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
}

export type PlayerTuiAction =
  | { type: "quit" | "help" | "play" | "pause" | "next" | "previous" | "search" | "playlists" | "queue" | "devices" | "seek-forward" | "seek-backward" | "volume-up" | "volume-down" | "select" | "add" | "remove" | "cancel-search" | "search-submit" }
  | { type: "move"; amount: number }
  | { type: "search-text"; text: string };

export function playerTuiAction(input: string, key: TuiKey, editingSearch: boolean): PlayerTuiAction | null {
  if (editingSearch) {
    if (key.escape) return { type: "cancel-search" };
    if (key.return) return { type: "search-submit" };
    if (key.backspace) return { type: "search-text", text: "\b" };
    if (input && !input.includes("\u001b")) return { type: "search-text", text: input };
    return null;
  }
  if (input === "q") return { type: "quit" };
  if (input === "?") return { type: "help" };
  if (input === "r") return { type: "play" };
  if (input === " ") return { type: "pause" };
  if (input === "n") return { type: "next" };
  if (input === "p") return { type: "previous" };
  if (input === "/") return { type: "search" };
  if (input === "l") return { type: "playlists" };
  if (input === "u") return { type: "queue" };
  if (input === "d") return { type: "devices" };
  if (input === "a") return { type: "add" };
  if (input === "x" || key.backspace) return { type: "remove" };
  if (input === "+" || input === "=") return { type: "volume-up" };
  if (input === "-") return { type: "volume-down" };
  if (key.upArrow || input === "k") return { type: "move", amount: -1 };
  if (key.downArrow || input === "j") return { type: "move", amount: 1 };
  if (key.leftArrow) return { type: "seek-backward" };
  if (key.rightArrow) return { type: "seek-forward" };
  if (key.return) return { type: "select" };
  return null;
}
