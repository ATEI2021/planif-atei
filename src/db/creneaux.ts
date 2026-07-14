import { db, ready } from "./client";
import type { Creneau } from "./types";

export interface NouveauCreneau {
  date: string;
  heure_debut: string;
  heure_fin: string;
}

// Crée le créneau s'il n'existe pas déjà (même date/heures), puis le lie à l'intervention.
export async function proposerCreneau(interventionId: number, creneau: NouveauCreneau): Promise<Creneau> {
  await ready();
  const existant = await db.execute({
    sql: "SELECT * FROM creneaux WHERE date = ? AND heure_debut = ? AND heure_fin = ? AND statut = 'libre'",
    args: [creneau.date, creneau.heure_debut, creneau.heure_fin],
  });

  let creneauFinal = existant.rows[0] as unknown as Creneau | undefined;

  if (!creneauFinal) {
    const inserted = await db.execute({
      sql: "INSERT INTO creneaux (date, heure_debut, heure_fin) VALUES (?, ?, ?)",
      args: [creneau.date, creneau.heure_debut, creneau.heure_fin],
    });
    creneauFinal = await getCreneauById(Number(inserted.lastInsertRowid));
  }

  await db.execute({
    sql: "INSERT OR IGNORE INTO intervention_creneaux (intervention_id, creneau_id) VALUES (?, ?)",
    args: [interventionId, creneauFinal!.id],
  });

  return creneauFinal!;
}

export async function getCreneauById(id: number): Promise<Creneau | undefined> {
  await ready();
  const result = await db.execute({ sql: "SELECT * FROM creneaux WHERE id = ?", args: [id] });
  return result.rows[0] as unknown as Creneau | undefined;
}

export async function listCreneauxProposes(interventionId: number): Promise<Creneau[]> {
  await ready();
  const result = await db.execute({
    sql: `SELECT c.* FROM creneaux c
          JOIN intervention_creneaux ic ON ic.creneau_id = c.id
          WHERE ic.intervention_id = ?
          ORDER BY c.date, c.heure_debut`,
    args: [interventionId],
  });
  return result.rows as unknown as Creneau[];
}

// Remet un créneau confirmé à disposition (utilisé lors d'un veto).
export async function libererCreneau(creneauId: number): Promise<void> {
  await ready();
  await db.execute({
    sql: "UPDATE creneaux SET statut = 'libre', intervention_confirmee_id = NULL WHERE id = ?",
    args: [creneauId],
  });
}
