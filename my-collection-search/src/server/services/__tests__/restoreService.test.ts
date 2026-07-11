import { describe, expect, it } from "vitest";
import {
  buildRestorePrepSql,
  classifyBackup,
} from "../restoreService";

describe("classifyBackup()", () => {
  it("classifies custom dumps as schema+data", () => {
    const result = classifyBackup("backup.dump", Buffer.from("ignored"));
    expect(result).toEqual({ fileType: "dump", backupType: "schema+data" });
  });

  it("detects schema-bearing sql backups", () => {
    const result = classifyBackup(
      "backup.sql",
      Buffer.from("CREATE TABLE tracks (id int);\n")
    );
    expect(result).toEqual({ fileType: "sql", backupType: "schema+data" });
  });

  it("detects data-only sql backups", () => {
    const result = classifyBackup(
      "backup.sql",
      Buffer.from("COPY public.tracks (track_id) FROM stdin;\n")
    );
    expect(result).toEqual({ fileType: "sql", backupType: "data-only" });
  });
});

describe("buildRestorePrepSql()", () => {
  it("uses TRUNCATE for data-only restores", () => {
    const sql = buildRestorePrepSql("data-only", "djplaylist");
    expect(sql).toContain("TRUNCATE TABLE");
    expect(sql).toContain("tablename <> 'pgmigrations'");
    expect(sql).not.toContain("DROP SCHEMA");
  });

  it("uses DROP OWNED instead of recreating public for schema+data restores", () => {
    const sql = buildRestorePrepSql("schema+data", "djplaylist");
    expect(sql).toContain('DROP OWNED BY "djplaylist" CASCADE;');
    expect(sql).toContain('GRANT ALL ON SCHEMA public TO "djplaylist";');
    expect(sql).not.toContain("DROP SCHEMA");
    expect(sql).not.toContain("CREATE SCHEMA public");
  });
});
