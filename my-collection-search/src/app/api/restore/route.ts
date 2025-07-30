import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function parsePgUrl(pgUrl: string) {
  try {
    const url = new URL(pgUrl);
    return {
      user: url.username,
      pass: url.password,
      host: url.hostname,
      port: url.port || 5432,
      db: url.pathname.replace(/^\//, ""),
    };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    // Save uploaded file to /app/dumps/restore.sql
    const restoreDir = path.resolve("dumps");
    if (!fs.existsSync(restoreDir))
      fs.mkdirSync(restoreDir, { recursive: true });
    const restorePath = path.join(restoreDir, "restore.sql");
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(restorePath, Buffer.from(arrayBuffer));

    // Get DB connection info from env
    let pg = {
      url: process.env.DATABASE_URL,
      db: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      pass: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
    };
    if (pg.url) {
      const parsed = parsePgUrl(pg.url);
      pg = {
        ...pg,
        ...{ ...parsed, port: parsed.port ? String(parsed.port) : undefined },
      };
    }
    const db = pg.db || "mydb";
    const user = pg.user || "myuser";
    const pass = pg.pass || "mypassword";
    const host = pg.host || "db";
    const port = pg.port || "5432";

    // Delete all rows from all tables before restore
    // Generate a script that disables triggers, deletes all data, and re-enables triggers
    const cleanScript = `\nDO $$ DECLARE\n    r RECORD;\nBEGIN\n    -- Disable triggers\n    EXECUTE 'SET session_replication_role = replica';\n    -- Delete from all tables\n    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP\n        EXECUTE 'DELETE FROM "' || r.tablename || '"';\n    END LOOP;\n    -- Re-enable triggers\n    EXECUTE 'SET session_replication_role = DEFAULT';\nEND $$;\n`;
    const cleanPath = path.join(restoreDir, "clean.sql");
    fs.writeFileSync(cleanPath, cleanScript);
    // Run the clean script
    const cleanCmd = `PGPASSWORD='${pass}' psql -U ${user} -h ${host} -p ${port} -d ${db} -f '${cleanPath}'`;
    execSync(cleanCmd, {
      stdio: "ignore",
      env: { ...process.env, PGPASSWORD: pass },
    });

    // Run psql restore
    const cmd = `PGPASSWORD='${pass}' psql -U ${user} -h ${host} -p ${port} -d ${db} -f '${restorePath}'`;
    execSync(cmd, {
      stdio: "ignore",
      env: { ...process.env, PGPASSWORD: pass },
    });

    return NextResponse.json({
      message: "Database cleaned and restored successfully.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
