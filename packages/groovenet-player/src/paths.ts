import { homedir } from "node:os";
import { join } from "node:path";
import type { PlayerDaemonPaths } from "./daemon.js";

/** Where the daemon's control socket and pidfile live: `~/.groovenet/player/`. */
export function defaultPlayerPaths(home: string = homedir()): PlayerDaemonPaths {
  const dir = join(home, ".groovenet", "player");
  return { socketPath: join(dir, "player.sock"), pidPath: join(dir, "player.pid") };
}
