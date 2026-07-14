"use server";

import { revalidatePath } from "next/cache";
import { getInterventionByToken, updateInterventionStatut, confirmerCreneauIntervention } from "@/db/interventions";
import { listCreneauxProposes, reserverCreneau, libererCreneau } from "@/db/creneaux";
import { ajouterEvenement } from "@/db/evenements";
import { modificationEncorePossible } from "@/lib/fenetre";

export interface ResultatAction {
  ok: boolean;
  erreur?: string;
}

export async function choisirCreneau(token: string, creneauId: number): Promise<ResultatAction> {
  const intervention = await getInterventionByToken(token);
  if (!intervention) return { ok: false, erreur: "Lien invalide." };
  if (intervention.statut === "annulee") return { ok: false, erreur: "Cette intervention a été annulée." };
  if (intervention.statut === "brouillon") return { ok: false, erreur: "Ce lien n'est pas encore actif." };

  const creneauxProposes = await listCreneauxProposes(intervention.id);
  const cible = creneauxProposes.find((c) => c.id === creneauId);
  if (!cible) return { ok: false, erreur: "Créneau invalide." };

  if (intervention.statut === "confirmee") {
    if (intervention.creneau_confirme_id === creneauId) return { ok: true };
    const confirme = creneauxProposes.find((c) => c.id === intervention.creneau_confirme_id);
    if (confirme && !modificationEncorePossible(confirme.date, intervention.fenetre_modification_jours)) {
      return { ok: false, erreur: "La fenêtre de modification est dépassée. Merci de contacter ATEI." };
    }
  }

  const succes = await reserverCreneau(creneauId, intervention.id);
  if (!succes) {
    return { ok: false, erreur: "Ce créneau vient d'être pris par quelqu'un d'autre. Merci d'en choisir un autre." };
  }

  const ancienId = intervention.creneau_confirme_id;
  if (ancienId && ancienId !== creneauId) {
    await libererCreneau(ancienId);
  }

  await confirmerCreneauIntervention(intervention.id, creneauId);
  await ajouterEvenement(
    intervention.id,
    "creneau_choisi",
    "assure",
    ancienId ? "Modification du créneau choisi" : "Choix initial du créneau"
  );
  await ajouterEvenement(
    intervention.id,
    "sms_envoye",
    "systeme",
    "Confirmation assuré (simulation, SMS branché à l'étape 6)"
  );
  await ajouterEvenement(
    intervention.id,
    "email_envoye",
    "systeme",
    "Notification Vincent : créneau choisi (simulation, email branché à l'étape 5)"
  );

  revalidatePath(`/t/${token}`);
  revalidatePath(`/backoffice/${intervention.id}`);
  return { ok: true };
}

export async function aucuneDateConvient(token: string): Promise<ResultatAction> {
  const intervention = await getInterventionByToken(token);
  if (!intervention) return { ok: false, erreur: "Lien invalide." };
  if (intervention.statut === "confirmee" || intervention.statut === "annulee") {
    return { ok: false, erreur: "Action non disponible pour cette intervention." };
  }

  await updateInterventionStatut(intervention.id, "a_recontacter");
  await ajouterEvenement(intervention.id, "aucune_date_convient", "assure");
  await ajouterEvenement(
    intervention.id,
    "email_envoye",
    "systeme",
    "Alerte Vincent : aucune date ne convient (simulation, email branché à l'étape 5)"
  );

  revalidatePath(`/t/${token}`);
  revalidatePath(`/backoffice/${intervention.id}`);
  return { ok: true };
}
