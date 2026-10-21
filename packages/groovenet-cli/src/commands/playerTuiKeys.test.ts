import { describe, expect, it } from "vitest";
import { playerTuiAction } from "./playerTuiKeys.js";

describe("player TUI key mapping", () => {
  it("maps transport, navigation, and view controls", () => {
    expect(playerTuiAction(" ", {}, false)).toEqual({ type: "pause" });
    expect(playerTuiAction("n", {}, false)).toEqual({ type: "next" });
    expect(playerTuiAction("p", {}, false)).toEqual({ type: "previous" });
    expect(playerTuiAction("r", {}, false)).toEqual({ type: "play" });
    expect(playerTuiAction("/", {}, false)).toEqual({ type: "search" });
    expect(playerTuiAction("l", {}, false)).toEqual({ type: "playlists" });
    expect(playerTuiAction("d", {}, false)).toEqual({ type: "devices" });
    expect(playerTuiAction("j", {}, false)).toEqual({ type: "move", amount: 1 });
    expect(playerTuiAction("", { leftArrow: true }, false)).toEqual({ type: "seek-backward" });
    expect(playerTuiAction("q", {}, false)).toEqual({ type: "quit" });
  });

  it("edits a search query and handles submit/cancel keys", () => {
    expect(playerTuiAction("b", {}, true)).toEqual({ type: "search-text", text: "b" });
    expect(playerTuiAction("", { backspace: true }, true)).toEqual({ type: "search-text", text: "\b" });
    expect(playerTuiAction("", { return: true }, true)).toEqual({ type: "search-submit" });
    expect(playerTuiAction("", { escape: true }, true)).toEqual({ type: "cancel-search" });
    expect(playerTuiAction("", {}, true)).toBeNull();
  });
});
