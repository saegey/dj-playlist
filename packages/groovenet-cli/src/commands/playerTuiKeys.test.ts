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
    expect(playerTuiAction("k", {}, false)).toEqual({ type: "move", amount: -1 });
    expect(playerTuiAction("", { upArrow: true }, false)).toEqual({ type: "move", amount: -1 });
    expect(playerTuiAction("", { downArrow: true }, false)).toEqual({ type: "move", amount: 1 });
    expect(playerTuiAction("", { return: true }, false)).toEqual({ type: "select" });
    expect(playerTuiAction("", { backspace: true }, false)).toEqual({ type: "remove" });
    expect(playerTuiAction("=", {}, false)).toEqual({ type: "volume-up" });
    expect(playerTuiAction("", { rightArrow: true }, false)).toEqual({ type: "seek-forward" });
    expect(playerTuiAction("?", {}, false)).toEqual({ type: "help" });
    expect(playerTuiAction("z", {}, false)).toBeNull();
  });

  it("edits a search query and handles submit/cancel keys", () => {
    expect(playerTuiAction("b", {}, true)).toEqual({ type: "search-text", text: "b" });
    expect(playerTuiAction("", { backspace: true }, true)).toEqual({ type: "search-text", text: "\b" });
    expect(playerTuiAction("", { return: true }, true)).toEqual({ type: "search-submit" });
    expect(playerTuiAction("", { escape: true }, true)).toEqual({ type: "cancel-search" });
    expect(playerTuiAction("", {}, true)).toBeNull();
  });
});
