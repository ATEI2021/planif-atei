import { db } from "./client";
import { generateToken } from "@/lib/token";
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

export function createIntervention(data: NouvelleIntervention): Intervention {
  const stmt = db.prepare(`
    INSERT INTO interventions
      (reference_sinistre, compagnie, assure_nom, assure_telephone, adresse_chantier,
       duree_prevue, preparatifs_liste, preparatifs_libre, fenetre_modification_jours, token)
    VALUES (@reference_sinistre, @compagnie, @assure_nom, @assure_telephone, @adresse_chantier,
            @duree_prevue, @preparatifs_liste, @preparatifs_libre, @fenetre_modification_jours, @token)
  `);
  const result = stmt.run({
    reference_sinistre: data.reference_sinistre,
    compagnie: data.compagnie,
    assure_nom: data.assure_nom,
    assure_telephone: data.assure_telephone,
    adresse_chantier: data.adresse_chantier,
    duree_prevue: data.duree_prevue,
    preparatifs_liste: JSON.stringify(data.preparatifs_liste ?? []),
    preparatifs_libre: data.preparatifs_libre ?? "",
    fenetre_modification_jours: data.fenetre_modification_jours ?? 7,
    token: generateToken(),
  });
  return getInterventionById(result.lastInsertRowid as number)!;
}

export function getInterventionById(id: number): Intervention | undefined {
  return db.prepare("SELECT * FROM interventions WHERE id = ?").get(id) as Intervention | undefined;
}

export function getInterventionByToken(token: string): Intervention | undefined {
  return db.prepare("SELECT * FROM interventions WHERE token = ?").get(token) as Intervention | undefined;
}

export function listInterventions(): Intervention[] {
  return db.prepare("SELECT * FROM interventions ORDER BY created_at DESC").all() as Intervention[];
}

export function updateInterventionStatut(id: number, statut: StatutIntervention): void {
  db.prepare(
    "UPDATE interventions SET statut = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?"
  ).run(statut, id);
}
