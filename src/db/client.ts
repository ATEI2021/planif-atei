import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";

function resolveUrl(): string {
  return process.env.TURSO_DATABASE_URL ?? "file:./data/planif.db";
}

function createConnection(): Client {
  const url = resolveUrl();
  if (url.startsWith("file:")) {
    const dbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), url.replace(/^file:/, ""));
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
  return db.executeMultiple(SCHEMA_SQL);
}

// La première requête de chaque instance applique le schéma (idempotent, CREATE TABLE IF NOT EXISTS).
export function ready(): Promise<void> {
  if (!globalThis.__planifSchemaReady) {
    globalThis.__planifSchemaReady = initSchema();
  }
  return globalThis.__planifSchemaReady;
}

// Les Row renvoyees par @libsql/client ne sont pas de purs objets JS (methodes sur le prototype),
// ce que React refuse de serialiser vers un Client Component. On les aplatit ici.
export function toPlain<T>(row: unknown): T {
  return JSON.parse(JSON.stringify(row)) as T;
}
