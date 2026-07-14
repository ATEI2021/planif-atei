import { db, ready, toPlain } from "./client";
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

  let creneauFinal = existant.rows[0] ? toPlain<Creneau>(existant.rows[0]) : undefined;

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
  return result.rows[0] ? toPlain<Creneau>(result.rows[0]) : undefined;
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
  return toPlain<Creneau[]>(result.rows);
}

// Remet un créneau confirmé à disposition (utilisé lors d'un veto).
export async function libererCreneau(creneauId: number): Promise<void> {
  await ready();
  await db.execute({
    sql: "UPDATE creneaux SET statut = 'libre', intervention_confirmee_id = NULL WHERE id = ?",
    args: [creneauId],
  });
}

// Reservation atomique : ne reussit que si le creneau etait encore libre
// (premier arrive gagne, meme si le creneau est propose a plusieurs interventions).
export async function reserverCreneau(creneauId: number, interventionId: number): Promise<boolean> {
  await ready();
  const result = await db.execute({
    sql: "UPDATE creneaux SET statut = 'pris', intervention_confirmee_id = ? WHERE id = ? AND statut = 'libre'",
    args: [interventionId, creneauId],
  });
  return result.rowsAffected === 1;
}
