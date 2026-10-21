import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/types.ts", "src/queue.ts", "src/resolver.ts", "src/player.ts", "src/mpvBackend.ts", "src/protocol.ts", "src/daemon.ts"],
      reporter: ["lcov", "text"],
    },
  },
});
