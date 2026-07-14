"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createIntervention,
  getInterventionById,
  updateInterventionStatut,
  annulerConfirmationIntervention,
} from "@/db/interventions";
import { proposerCreneau, libererCreneau } from "@/db/creneaux";
import { ajouterEvenement } from "@/db/evenements";
import { envoyerSms, envoyerEmailVincent } from "@/lib/brevo";
import { smsInvitation } from "@/lib/sms-templates";
import { HEURE_DEBUT_DEFAUT, HEURE_FIN_DEFAUT, FENETRE_MODIFICATION_JOURS_DEFAUT } from "@/lib/horaires";
import type { Intervention } from "@/db/types";

function getListe(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export async function creerIntervention(formData: FormData): Promise<void> {
  const dates = getListe(formData, "creneau_date");

  const intervention = await createIntervention({
    reference_sinistre: String(formData.get("reference_sinistre") ?? "").trim(),
    compagnie: String(formData.get("compagnie") ?? "").trim(),
    assure_nom: String(formData.get("assure_nom") ?? "").trim(),
    assure_telephone: String(formData.get("assure_telephone") ?? "").trim(),
    adresse_chantier: String(formData.get("adresse_chantier") ?? "").trim(),
    duree_prevue: String(formData.get("duree_prevue") ?? "").trim(),
    preparatifs_liste: getListe(formData, "preparatif"),
    preparatifs_libre: String(formData.get("preparatifs_libre") ?? "").trim(),
    fenetre_modification_jours: Number(formData.get("fenetre_modification_jours") ?? FENETRE_MODIFICATION_JOURS_DEFAUT),
  });

  for (const date of dates) {
    await proposerCreneau(intervention.id, { date, heure_debut: HEURE_DEBUT_DEFAUT, heure_fin: HEURE_FIN_DEFAUT });
  }

  redirect(`/backoffice/${intervention.id}`);
}

export async function dupliquerIntervention(sourceId: number): Promise<void> {
  const source = await getInterventionById(sourceId);
  if (!source) return;

  const intervention = await createIntervention({
    reference_sinistre: source.reference_sinistre,
    compagnie: source.compagnie,
    assure_nom: source.assure_nom,
    assure_telephone: source.assure_telephone,
    adresse_chantier: source.adresse_chantier,
    duree_prevue: source.duree_prevue,
    preparatifs_liste: JSON.parse(source.preparatifs_liste),
    preparatifs_libre: source.preparatifs_libre,
    fenetre_modification_jours: source.fenetre_modification_jours,
  });

  redirect(`/backoffice/${intervention.id}`);
}

export async function ajouterCreneauAction(interventionId: number, formData: FormData): Promise<void> {
  const date = String(formData.get("date") ?? "");
  if (date) {
    await proposerCreneau(interventionId, { date, heure_debut: HEURE_DEBUT_DEFAUT, heure_fin: HEURE_FIN_DEFAUT });
  }
  revalidatePath(`/backoffice/${interventionId}`);
}

function lienAssure(token: string): string {
  return `${process.env.APP_URL ?? "http://localhost:3000"}/t/${token}`;
}

async function envoyerInvitationSms(intervention: Intervention, contexte: "vincent"): Promise<void> {
  const texte = smsInvitation({
    compagnie: intervention.compagnie,
    ref: intervention.reference_sinistre,
    lien: lienAssure(intervention.token),
    duree: intervention.duree_prevue,
  });

  try {
    const resultat = await envoyerSms(intervention.assure_telephone, texte);
    await ajouterEvenement(
      intervention.id,
      "sms_envoye",
      contexte,
      resultat.simule ? "Invitation (simulation, BREVO_API_KEY non configurée)" : "Invitation"
    );
    await updateInterventionStatut(intervention.id, "envoyee");
  } catch (err) {
    await ajouterEvenement(intervention.id, "sms_echec", "systeme", String(err));
    await envoyerEmailVincent(
      `[PLANIF] ${intervention.reference_sinistre} — Échec d'envoi SMS`,
      `L'envoi du SMS d'invitation a échoué pour l'intervention ${intervention.reference_sinistre} (${intervention.compagnie}).\n\nErreur : ${err}`
    );
  }
}

export async function envoyerInvitation(interventionId: number): Promise<void> {
  const intervention = await getInterventionById(interventionId);
  if (intervention) await envoyerInvitationSms(intervention, "vincent");
  revalidatePath(`/backoffice/${interventionId}`);
  revalidatePath("/backoffice");
}

export async function renvoyerSms(interventionId: number): Promise<void> {
  const intervention = await getInterventionById(interventionId);
  if (intervention) await envoyerInvitationSms(intervention, "vincent");
  revalidatePath(`/backoffice/${interventionId}`);
  revalidatePath("/backoffice");
}

export async function vetoIntervention(interventionId: number): Promise<void> {
  const intervention = await getInterventionById(interventionId);
  if (!intervention || intervention.statut !== "confirmee") return;
  if (!intervention.veto_deadline_at || new Date(intervention.veto_deadline_at) < new Date()) return;

  if (intervention.creneau_confirme_id) {
    await libererCreneau(intervention.creneau_confirme_id);
  }
  await annulerConfirmationIntervention(interventionId, "en_veto");
  await ajouterEvenement(interventionId, "veto", "vincent");
  revalidatePath(`/backoffice/${interventionId}`);
  revalidatePath("/backoffice");
}

export async function annulerIntervention(interventionId: number, formData: FormData): Promise<void> {
  const motif = String(formData.get("motif") ?? "").trim();
  const intervention = await getInterventionById(interventionId);
  if (intervention?.creneau_confirme_id) {
    await libererCreneau(intervention.creneau_confirme_id);
  }
  await annulerConfirmationIntervention(interventionId, "annulee");
  await ajouterEvenement(interventionId, "annulation", "vincent", motif);
  revalidatePath(`/backoffice/${interventionId}`);
  revalidatePath("/backoffice");
}
