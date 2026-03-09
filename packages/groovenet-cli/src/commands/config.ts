import { Command } from "commander";
import { loadConfig, saveConfig } from "@groovenet/client";
import { printJson, printSuccess, printError } from "../output.js";

type ConfigKey = "api_base" | "api_key" | "default_friend_id" | "username";

const VALID_KEYS: ConfigKey[] = ["api_base", "api_key", "default_friend_id", "username"];

export function addConfigCommands(program: Command): void {
  const config = program.command("config").description("Manage CLI configuration");

  config
    .command("set <key> <value>")
    .description(`Set a config value. Keys: ${VALID_KEYS.join(", ")}`)
    .action((key: string, value: string) => {
      if (!VALID_KEYS.includes(key as ConfigKey)) {
        printError(`Unknown config key "${key}". Valid keys: ${VALID_KEYS.join(", ")}`);
        process.exit(2);
      }
      const update: Record<string, string | number> = {};
      if (key === "default_friend_id") {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
          printError(`default_friend_id must be a number`);
          process.exit(2);
        }
        update[key] = num;
      } else {
        update[key] = value;
      }
      saveConfig(update);
      printSuccess(`✓ Set ${key} = ${value}`);
    });

  config
    .command("show")
    .description("Show current configuration")
    .option("--json", "Output as JSON")
    .action((opts: { json?: boolean }) => {
      const cfg = loadConfig();
      if (opts.json) {
        printJson(cfg);
      } else {
        console.log("Current configuration:");
        for (const [k, v] of Object.entries(cfg)) {
          const display = k === "api_key" && v ? "***" : v;
          console.log(`  ${k}: ${display}`);
        }
      }
    });
}
