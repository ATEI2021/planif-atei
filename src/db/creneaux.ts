import { db } from "./client";
import type { Creneau } from "./types";

export interface NouveauCreneau {
  date: string;
  heure_debut: string;
  heure_fin: string;
}

// Crée le créneau s'il n'existe pas déjà (même date/heures), puis le lie à l'intervention.
export function proposerCreneau(interventionId: number, creneau: NouveauCreneau): Creneau {
  const existant = db
    .prepare("SELECT * FROM creneaux WHERE date = ? AND heure_debut = ? AND heure_fin = ? AND statut = 'libre'")
    .get(creneau.date, creneau.heure_debut, creneau.heure_fin) as Creneau | undefined;

  const creneauFinal =
    existant ??
    (() => {
      const result = db
        .prepare("INSERT INTO creneaux (date, heure_debut, heure_fin) VALUES (?, ?, ?)")
        .run(creneau.date, creneau.heure_debut, creneau.heure_fin);
      return getCreneauById(result.lastInsertRowid as number)!;
    })();

  db.prepare(
    "INSERT OR IGNORE INTO intervention_creneaux (intervention_id, creneau_id) VALUES (?, ?)"
  ).run(interventionId, creneauFinal.id);

  return creneauFinal;
}

export function getCreneauById(id: number): Creneau | undefined {
  return db.prepare("SELECT * FROM creneaux WHERE id = ?").get(id) as Creneau | undefined;
}

export function listCreneauxProposes(interventionId: number): Creneau[] {
  return db
    .prepare(
      `SELECT c.* FROM creneaux c
       JOIN intervention_creneaux ic ON ic.creneau_id = c.id
       WHERE ic.intervention_id = ?
       ORDER BY c.date, c.heure_debut`
    )
    .all(interventionId) as Creneau[];
}
