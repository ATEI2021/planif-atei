import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./data/planif.db";
  const relative = url.replace(/^file:/, "");
  return path.resolve(process.cwd(), relative);
}

function createConnection(): Database.Database {
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(path.join(process.cwd(), "src/db/schema.sql"), "utf-8");
  db.exec(schema);

  return db;
}

declare global {
  var __planifDb: Database.Database | undefined;
}

export const db = globalThis.__planifDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__planifDb = db;
}
