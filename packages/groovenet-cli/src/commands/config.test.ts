import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addConfigCommands } from "./config.js";

const { saveConfig, loadConfig } = vi.hoisted(() => ({
  saveConfig: vi.fn(),
  loadConfig: vi.fn(() => ({ api_base: "http://x/api", default_friend_id: 1, player_artwork: true })),
}));
vi.mock("@groovenet/client", () => ({ saveConfig, loadConfig }));

async function run(...args: string[]) {
  const program = new Command();
  program.exitOverride();
  addConfigCommands(program);
  await program.parseAsync(["node", "test", "config", ...args]);
}

describe("config player_artwork", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([["true", true], ["ON", true], ["1", true], ["false", false], ["no", false], ["0", false]])(
    "stores %s as %s",
    async (value, expected) => {
      vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      await run("set", "player_artwork", value);
      expect(saveConfig).toHaveBeenLastCalledWith({ player_artwork: expected });
    }
  );

  it("rejects values that are not booleans", async () => {
    saveConfig.mockClear();
    const error = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const exit = vi.spyOn(process, "exit").mockImplementation((() => { throw new Error("exit"); }) as never);
    await expect(run("set", "player_artwork", "maybe")).rejects.toThrow("exit");
    expect(exit).toHaveBeenCalledWith(2);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("player_artwork must be true or false"));
    expect(saveConfig).not.toHaveBeenCalled();
  });

  it("shows the stored value", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await run("show");
    expect(log).toHaveBeenCalledWith("  player_artwork: true");
  });

  it("keeps the existing keys working", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await run("set", "insecure_tls", "yes");
    expect(saveConfig).toHaveBeenLastCalledWith({ insecure_tls: true });
    await run("set", "default_friend_id", "7");
    expect(saveConfig).toHaveBeenLastCalledWith({ default_friend_id: 7 });
    await run("set", "username", "dj");
    expect(saveConfig).toHaveBeenLastCalledWith({ username: "dj" });
  });

  it("rejects unknown keys and a non-numeric friend id", async () => {
    saveConfig.mockClear();
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const exit = vi.spyOn(process, "exit").mockImplementation((() => { throw new Error("exit"); }) as never);
    await expect(run("set", "nope", "1")).rejects.toThrow("exit");
    await expect(run("set", "default_friend_id", "abc")).rejects.toThrow("exit");
    expect(exit).toHaveBeenCalledTimes(2);
    expect(saveConfig).not.toHaveBeenCalled();
  });
});
