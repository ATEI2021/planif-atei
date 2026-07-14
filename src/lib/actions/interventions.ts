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

function getListe(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export async function creerIntervention(formData: FormData): Promise<void> {
  const dates = getListe(formData, "creneau_date");
  const debuts = getListe(formData, "creneau_debut");
  const fins = getListe(formData, "creneau_fin");

  const intervention = await createIntervention({
    reference_sinistre: String(formData.get("reference_sinistre") ?? "").trim(),
    compagnie: String(formData.get("compagnie") ?? "").trim(),
    assure_nom: String(formData.get("assure_nom") ?? "").trim(),
    assure_telephone: String(formData.get("assure_telephone") ?? "").trim(),
    adresse_chantier: String(formData.get("adresse_chantier") ?? "").trim(),
    duree_prevue: String(formData.get("duree_prevue") ?? "").trim(),
    preparatifs_liste: getListe(formData, "preparatif"),
    preparatifs_libre: String(formData.get("preparatifs_libre") ?? "").trim(),
    fenetre_modification_jours: Number(formData.get("fenetre_modification_jours") ?? 7),
  });

  for (let i = 0; i < dates.length; i++) {
    if (!dates[i] || !debuts[i] || !fins[i]) continue;
    await proposerCreneau(intervention.id, { date: dates[i], heure_debut: debuts[i], heure_fin: fins[i] });
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
  const heureDebut = String(formData.get("heure_debut") ?? "");
  const heureFin = String(formData.get("heure_fin") ?? "");
  if (date && heureDebut && heureFin) {
    await proposerCreneau(interventionId, { date, heure_debut: heureDebut, heure_fin: heureFin });
  }
  revalidatePath(`/backoffice/${interventionId}`);
}

export async function envoyerInvitation(interventionId: number): Promise<void> {
  await ajouterEvenement(interventionId, "sms_envoye", "vincent", "Invitation (simulation, SMS branché à l'étape 6)");
  await updateInterventionStatut(interventionId, "envoyee");
  revalidatePath(`/backoffice/${interventionId}`);
  revalidatePath("/backoffice");
}

export async function renvoyerSms(interventionId: number): Promise<void> {
  await ajouterEvenement(interventionId, "sms_envoye", "vincent", "Renvoi manuel (simulation, SMS branché à l'étape 6)");
  await updateInterventionStatut(interventionId, "envoyee");
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
