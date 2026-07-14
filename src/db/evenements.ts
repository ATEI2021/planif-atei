import { db } from "./client";
import type { AuteurEvenement, Evenement, TypeEvenement } from "./types";

export function ajouterEvenement(
  interventionId: number,
  type: TypeEvenement,
  auteur: AuteurEvenement,
  detail = ""
): void {
  db.prepare(
    "INSERT INTO evenements (intervention_id, type, detail, auteur) VALUES (?, ?, ?, ?)"
  ).run(interventionId, type, detail, auteur);
}

export function listEvenements(interventionId: number): Evenement[] {
  return db
    .prepare("SELECT * FROM evenements WHERE intervention_id = ? ORDER BY created_at ASC")
    .all(interventionId) as Evenement[];
}

export function evenementDejaEnvoye(interventionId: number, type: TypeEvenement): boolean {
  const row = db
    .prepare("SELECT 1 FROM evenements WHERE intervention_id = ? AND type = ? LIMIT 1")
    .get(interventionId, type);
  return row !== undefined;
}
