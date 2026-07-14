import { listInterventions, updateInterventionStatut } from "@/db/interventions";
import { getCreneauById } from "@/db/creneaux";
import { ajouterEvenement, evenementDejaEnvoye, datePremierEvenement } from "@/db/evenements";
import { envoyerSms, envoyerEmailVincent } from "@/lib/brevo";
import { smsRappelJ7, smsRappelJ2, smsRelanceJ5 } from "@/lib/sms-templates";
import { dateLimiteModification } from "@/lib/fenetre";

function lienAssure(token: string): string {
  return `${process.env.APP_URL ?? "http://localhost:3000"}/t/${token}`;
}

// Nombre de jours entre deux dates (b - a), en ignorant l'heure.
function joursEntre(a: Date, b: Date): number {
  const debut = new Date(a).setHours(0, 0, 0, 0);
  const fin = new Date(b).setHours(0, 0, 0, 0);
  return Math.round((fin - debut) / (1000 * 60 * 60 * 24));
}

export interface ResumeAutomatisations {
  rappelsJ7: number;
  rappelsJ2: number;
  relancesJ5: number;
  alertesJ8: number;
  erreurs: string[];
}

export async function executerAutomatisationsQuotidiennes(): Promise<ResumeAutomatisations> {
  const resume: ResumeAutomatisations = {
    rappelsJ7: 0,
    rappelsJ2: 0,
    relancesJ5: 0,
    alertesJ8: 0,
    erreurs: [],
  };
  const interventions = await listInterventions();
  const aujourdHui = new Date();

  for (const intervention of interventions) {
    try {
      if (intervention.statut === "confirmee" && intervention.creneau_confirme_id) {
        const creneau = await getCreneauById(intervention.creneau_confirme_id);
        if (creneau) {
          const jours = joursEntre(aujourdHui, new Date(`${creneau.date}T00:00:00`));
          const dateFr = new Date(`${creneau.date}T00:00:00`).toLocaleDateString("fr-FR");

          if (jours === 7 && !(await evenementDejaEnvoye(intervention.id, "rappel_j7"))) {
            const dateLimite = dateLimiteModification(creneau.date, intervention.fenetre_modification_jours);
            await envoyerSms(
              intervention.assure_telephone,
              smsRappelJ7({
                compagnie: intervention.compagnie,
                ref: intervention.reference_sinistre,
                date: dateFr,
                dateLimite: dateLimite.toLocaleDateString("fr-FR"),
                lien: lienAssure(intervention.token),
              })
            );
            await ajouterEvenement(intervention.id, "rappel_j7", "systeme");
            resume.rappelsJ7++;
          }

          if (jours === 2 && !(await evenementDejaEnvoye(intervention.id, "rappel_j2"))) {
            const preparatifs: string[] = JSON.parse(intervention.preparatifs_liste);
            const preparatifsCourts = preparatifs.join(", ").slice(0, 60) || "voir details sur le lien";
            await envoyerSms(
              intervention.assure_telephone,
              smsRappelJ2({
                compagnie: intervention.compagnie,
                ref: intervention.reference_sinistre,
                date: dateFr,
                heure: creneau.heure_debut,
                preparatifsCourts,
                lien: lienAssure(intervention.token),
              })
            );
            await ajouterEvenement(intervention.id, "rappel_j2", "systeme");
            resume.rappelsJ2++;
          }
        }
      }

      if (intervention.statut === "envoyee") {
        const dateInvitation = await datePremierEvenement(intervention.id, "sms_envoye");
        if (dateInvitation) {
          const jours = joursEntre(new Date(dateInvitation), aujourdHui);

          if (jours === 5 && !(await evenementDejaEnvoye(intervention.id, "relance_j5"))) {
            await envoyerSms(
              intervention.assure_telephone,
              smsRelanceJ5({
                compagnie: intervention.compagnie,
                ref: intervention.reference_sinistre,
                lien: lienAssure(intervention.token),
              })
            );
            await ajouterEvenement(intervention.id, "relance_j5", "systeme");
            resume.relancesJ5++;
          }

          if (jours === 8 && !(await evenementDejaEnvoye(intervention.id, "alerte_j8"))) {
            await envoyerEmailVincent(
              `[PLANIF] ${intervention.reference_sinistre} — Sans réponse J+8`,
              `${intervention.assure_nom} n'a pas répondu à l'invitation depuis 8 jours pour l'intervention ` +
                `${intervention.reference_sinistre} (${intervention.compagnie}). Une relance téléphonique est recommandée.\n\n` +
                `Fiche : ${process.env.APP_URL ?? "http://localhost:3000"}/backoffice/${intervention.id}`
            );
            await updateInterventionStatut(intervention.id, "sans_reponse");
            await ajouterEvenement(intervention.id, "alerte_j8", "systeme");
            resume.alertesJ8++;
          }
        }
      }
    } catch (err) {
      resume.erreurs.push(`Intervention ${intervention.id}: ${err}`);
    }
  }

  return resume;
}
