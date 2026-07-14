import { randomBytes } from "node:crypto";

// Token alphanumérique, 16 caractères (>= 12 requis par le CDC)
export function generateToken(): string {
  return randomBytes(12).toString("base64url").slice(0, 16);
}
