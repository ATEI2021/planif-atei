"use server";

import { revalidatePath } from "next/cache";
import { getInterventionByToken, updateInterventionStatut, confirmerCreneauIntervention } from "@/db/interventions";
import { listCreneauxProposes, reserverCreneau, libererCreneau } from "@/db/creneaux";
import { ajouterEvenement } from "@/db/evenements";
import { modificationEncorePossible } from "@/lib/fenetre";
import { envoyerSms, envoyerEmailVincent } from "@/lib/brevo";
import { smsConfirmation } from "@/lib/sms-templates";

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

  const lien = `${process.env.APP_URL ?? "http://localhost:3000"}/t/${token}`;
  const dateFr = new Date(`${cible.date}T00:00:00`).toLocaleDateString("fr-FR");

  try {
    const resultatSms = await envoyerSms(
      intervention.assure_telephone,
      smsConfirmation({
        compagnie: intervention.compagnie,
        ref: intervention.reference_sinistre,
        date: dateFr,
        debut: cible.heure_debut,
        fin: cible.heure_fin,
        lien,
      })
    );
    await ajouterEvenement(
      intervention.id,
      "sms_envoye",
      "systeme",
      resultatSms.simule ? "Confirmation (simulation, BREVO_API_KEY non configurée)" : "Confirmation"
    );
  } catch (err) {
    await ajouterEvenement(intervention.id, "sms_echec", "systeme", String(err));
  }

  try {
    const resultatEmail = await envoyerEmailVincent(
      `[PLANIF] ${intervention.reference_sinistre} — Créneau choisi`,
      `${intervention.assure_nom} a choisi le créneau du ${dateFr} de ${cible.heure_debut} à ${cible.heure_fin} ` +
        `pour l'intervention ${intervention.reference_sinistre} (${intervention.compagnie}).\n\n` +
        `Fiche : ${process.env.APP_URL ?? "http://localhost:3000"}/backoffice/${intervention.id}`
    );
    await ajouterEvenement(
      intervention.id,
      "email_envoye",
      "systeme",
      resultatEmail.simule ? "Notification Vincent (simulation, BREVO_API_KEY non configurée)" : "Notification Vincent"
    );
  } catch (err) {
    await ajouterEvenement(intervention.id, "email_envoye", "systeme", `Échec envoi email : ${err}`);
  }

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

  try {
    const resultatEmail = await envoyerEmailVincent(
      `[PLANIF] ${intervention.reference_sinistre} — Aucune date ne convient`,
      `${intervention.assure_nom} indique qu'aucune date proposée ne lui convient pour l'intervention ` +
        `${intervention.reference_sinistre} (${intervention.compagnie}).\n\n` +
        `Fiche : ${process.env.APP_URL ?? "http://localhost:3000"}/backoffice/${intervention.id}`
    );
    await ajouterEvenement(
      intervention.id,
      "email_envoye",
      "systeme",
      resultatEmail.simule ? "Alerte Vincent (simulation, BREVO_API_KEY non configurée)" : "Alerte Vincent"
    );
  } catch (err) {
    await ajouterEvenement(intervention.id, "email_envoye", "systeme", `Échec envoi email : ${err}`);
  }

  revalidatePath(`/t/${token}`);
  revalidatePath(`/backoffice/${intervention.id}`);
  return { ok: true };
}
