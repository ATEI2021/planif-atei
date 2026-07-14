import { db, ready, toPlain } from "./client";
import type { AuteurEvenement, Evenement, TypeEvenement } from "./types";

export async function ajouterEvenement(
  interventionId: number,
  type: TypeEvenement,
  auteur: AuteurEvenement,
  detail = ""
): Promise<void> {
  await ready();
  await db.execute({
    sql: "INSERT INTO evenements (intervention_id, type, detail, auteur) VALUES (?, ?, ?, ?)",
    args: [interventionId, type, detail, auteur],
  });
}

export async function listEvenements(interventionId: number): Promise<Evenement[]> {
  await ready();
  const result = await db.execute({
    sql: "SELECT * FROM evenements WHERE intervention_id = ? ORDER BY created_at ASC",
    args: [interventionId],
  });
  return toPlain<Evenement[]>(result.rows);
}

export async function evenementDejaEnvoye(interventionId: number, type: TypeEvenement): Promise<boolean> {
  await ready();
  const result = await db.execute({
    sql: "SELECT 1 FROM evenements WHERE intervention_id = ? AND type = ? LIMIT 1",
    args: [interventionId, type],
  });
  return result.rows.length > 0;
}

// Date du premier evenement d'un type donne (ex. date d'envoi de l'invitation initiale).
export async function datePremierEvenement(interventionId: number, type: TypeEvenement): Promise<string | undefined> {
  await ready();
  const result = await db.execute({
    sql: "SELECT created_at FROM evenements WHERE intervention_id = ? AND type = ? ORDER BY created_at ASC LIMIT 1",
    args: [interventionId, type],
  });
  const row = result.rows[0] as unknown as { created_at: string } | undefined;
  return row?.created_at;
}
