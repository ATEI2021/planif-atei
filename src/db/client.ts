import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

function resolveUrl(): string {
  return process.env.TURSO_DATABASE_URL ?? "file:./data/planif.db";
}

function createConnection(): Client {
  const url = resolveUrl();
  if (url.startsWith("file:")) {
    const dbPath = path.resolve(process.cwd(), url.replace(/^file:/, ""));
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

declare global {
  var __planifDb: Client | undefined;
  var __planifSchemaReady: Promise<void> | undefined;
}

export const db: Client = globalThis.__planifDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__planifDb = db;
}

function initSchema(): Promise<void> {
  const schema = fs.readFileSync(path.join(process.cwd(), "src/db/schema.sql"), "utf-8");
  return db.executeMultiple(schema);
}

// La première requête de chaque instance applique le schéma (idempotent, CREATE TABLE IF NOT EXISTS).
export function ready(): Promise<void> {
  if (!globalThis.__planifSchemaReady) {
    globalThis.__planifSchemaReady = initSchema();
  }
  return globalThis.__planifSchemaReady;
}
