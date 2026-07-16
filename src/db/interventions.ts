import { db, ready, toPlain } from "./client";
import { generateToken } from "@/lib/token";
import { FENETRE_MODIFICATION_JOURS_DEFAUT } from "@/lib/horaires";
import type { Intervention, StatutIntervention } from "./types";

export interface NouvelleIntervention {
  reference_sinistre: string;
  compagnie: string;
  assure_nom: string;
  assure_telephone: string;
  adresse_chantier: string;
  duree_prevue: string;
  preparatifs_liste?: string[];
  preparatifs_libre?: string;
  fenetre_modification_jours?: number;
}

export async function createIntervention(data: NouvelleIntervention): Promise<Intervention> {
  await ready();
  const result = await db.execute({
    sql: `INSERT INTO interventions
      (reference_sinistre, compagnie, assure_nom, assure_telephone, adresse_chantier,
       duree_prevue, preparatifs_liste, preparatifs_libre, fenetre_modification_jours, token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.reference_sinistre,
      data.compagnie,
      data.assure_nom,
      data.assure_telephone,
      data.adresse_chantier,
      data.duree_prevue,
      JSON.stringify(data.preparatifs_liste ?? []),
      data.preparatifs_libre ?? "",
      data.fenetre_modification_jours ?? FENETRE_MODIFICATION_JOURS_DEFAUT,
      generateToken(),
    ],
  });
  const intervention = await getInterventionById(Number(result.lastInsertRowid));
  return intervention!;
}

export async function getInterventionById(id: number): Promise<Intervention | undefined> {
  await ready();
  const result = await db.execute({ sql: "SELECT * FROM interventions WHERE id = ?", args: [id] });
  return result.rows[0] ? toPlain<Intervention>(result.rows[0]) : undefined;
}

export async function getInterventionByReference(reference: string): Promise<Intervention | undefined> {
  await ready();
  const result = await db.execute({
    sql: "SELECT * FROM interventions WHERE reference_sinistre = ? ORDER BY created_at DESC LIMIT 1",
    args: [reference],
  });
  return result.rows[0] ? toPlain<Intervention>(result.rows[0]) : undefined;
}

export async function getInterventionByToken(token: string): Promise<Intervention | undefined> {
  await ready();
  const result = await db.execute({ sql: "SELECT * FROM interventions WHERE token = ?", args: [token] });
  return result.rows[0] ? toPlain<Intervention>(result.rows[0]) : undefined;
}

export async function listInterventions(): Promise<Intervention[]> {
  await ready();
  const result = await db.execute("SELECT * FROM interventions ORDER BY created_at DESC");
  return toPlain<Intervention[]>(result.rows);
}

export async function updateInterventionStatut(id: number, statut: StatutIntervention): Promise<void> {
  await ready();
  await db.execute({
    sql: "UPDATE interventions SET statut = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
    args: [statut, id],
  });
}

export async function confirmerCreneauIntervention(id: number, creneauId: number): Promise<void> {
  await ready();
  const veto = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.execute({
    sql: `UPDATE interventions
          SET statut = 'confirmee', creneau_confirme_id = ?, veto_deadline_at = ?,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = ?`,
    args: [creneauId, veto, id],
  });
}

export async function annulerConfirmationIntervention(id: number, statut: StatutIntervention): Promise<void> {
  await ready();
  await db.execute({
    sql: `UPDATE interventions
          SET statut = ?, creneau_confirme_id = NULL, veto_deadline_at = NULL,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = ?`,
    args: [statut, id],
  });
}
