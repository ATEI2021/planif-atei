import { createIntervention, getInterventionByToken, updateInterventionStatut } from "../src/db/interventions";
import { proposerCreneau, listCreneauxProposes } from "../src/db/creneaux";
import { ajouterEvenement, listEvenements, evenementDejaEnvoye } from "../src/db/evenements";
import { db } from "../src/db/client";

async function main() {
  const intervention = await createIntervention({
    reference_sinistre: "TEST-0001",
    compagnie: "PACIFICA",
    assure_nom: "Jean Dupont",
    assure_telephone: "0612345678",
    adresse_chantier: "1 rue de Test, 34160 Castries",
    duree_prevue: "2h",
    preparatifs_liste: ["Dégager l'accès", "Retirer les meubles"],
  });
  console.log("Intervention créée:", intervention.id, intervention.token, intervention.statut);

  const c1 = await proposerCreneau(intervention.id, { date: "2026-08-01", heure_debut: "09:00", heure_fin: "11:00" });
  const c2 = await proposerCreneau(intervention.id, { date: "2026-08-02", heure_debut: "14:00", heure_fin: "16:00" });
  console.log("Créneaux proposés:", (await listCreneauxProposes(intervention.id)).map((c) => c.id));

  await ajouterEvenement(intervention.id, "sms_envoye", "systeme", "invitation");
  await updateInterventionStatut(intervention.id, "envoyee");
  console.log("Déjà envoyé sms_envoye ?", await evenementDejaEnvoye(intervention.id, "sms_envoye"));
  console.log("Déjà envoyé rappel_j7 ?", await evenementDejaEnvoye(intervention.id, "rappel_j7"));

  const retrouvee = await getInterventionByToken(intervention.token);
  console.log("Retrouvée par token:", retrouvee?.reference_sinistre, retrouvee?.statut);

  console.log("Historique événements:", (await listEvenements(intervention.id)).length);

  // nettoyage des données de test
  await db.execute({ sql: "DELETE FROM evenements WHERE intervention_id = ?", args: [intervention.id] });
  await db.execute({ sql: "DELETE FROM intervention_creneaux WHERE intervention_id = ?", args: [intervention.id] });
  await db.execute({ sql: "DELETE FROM creneaux WHERE id IN (?, ?)", args: [c1.id, c2.id] });
  await db.execute({ sql: "DELETE FROM interventions WHERE id = ?", args: [intervention.id] });

  console.log("OK - couche données validée");
}

main();
