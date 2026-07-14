import { db } from "../src/db/client";
import { createIntervention, getInterventionById } from "../src/db/interventions";
import { proposerCreneau, reserverCreneau } from "../src/db/creneaux";
import { confirmerCreneauIntervention } from "../src/db/interventions";
import { listEvenements } from "../src/db/evenements";
import { executerAutomatisationsQuotidiennes } from "../src/lib/automatisations";

function isoDansNJours(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function isoInstantDansNJours(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().replace("T", " ").slice(0, 23);
}

async function creerConfirmee(joursAvant: number, ref: string) {
  const intervention = await createIntervention({
    reference_sinistre: ref,
    compagnie: "PACIFICA",
    assure_nom: "Test Auto",
    assure_telephone: "0600000000",
    adresse_chantier: "1 rue Test",
    duree_prevue: "2h",
    preparatifs_liste: ["Degager l'acces"],
  });
  const creneau = await proposerCreneau(intervention.id, {
    date: isoDansNJours(joursAvant),
    heure_debut: "09:00",
    heure_fin: "11:00",
  });
  await reserverCreneau(creneau.id, intervention.id);
  await confirmerCreneauIntervention(intervention.id, creneau.id);
  return intervention.id;
}

async function creerEnvoyee(joursDepuisInvitation: number, ref: string) {
  const intervention = await createIntervention({
    reference_sinistre: ref,
    compagnie: "VIAREN",
    assure_nom: "Test Auto 2",
    assure_telephone: "0600000000",
    adresse_chantier: "2 rue Test",
    duree_prevue: "1h",
  });
  await db.execute({
    sql: "UPDATE interventions SET statut = 'envoyee' WHERE id = ?",
    args: [intervention.id],
  });
  await db.execute({
    sql: "INSERT INTO evenements (intervention_id, type, detail, auteur, created_at) VALUES (?, 'sms_envoye', 'invitation test', 'vincent', ?)",
    args: [intervention.id, isoInstantDansNJours(-joursDepuisInvitation)],
  });
  return intervention.id;
}

async function main() {
  const idJ7 = await creerConfirmee(7, "TEST-J7");
  const idJ2 = await creerConfirmee(2, "TEST-J2");
  const idJ5 = await creerEnvoyee(5, "TEST-J5");
  const idJ8 = await creerEnvoyee(8, "TEST-J8");
  const idTemoin = await creerConfirmee(15, "TEST-TEMOIN"); // ne doit rien declencher

  console.log("Interventions de test créées:", { idJ7, idJ2, idJ5, idJ8, idTemoin });

  const resume = await executerAutomatisationsQuotidiennes();
  console.log("Résumé:", resume);

  for (const [label, id] of Object.entries({ idJ7, idJ2, idJ5, idJ8, idTemoin })) {
    const intervention = await getInterventionById(id);
    const evenements = await listEvenements(id);
    console.log(
      `${label} (#${id}) statut=${intervention?.statut} evenements=${evenements.map((e) => e.type).join(",")}`
    );
  }

  // nettoyage (casser le cycle de references avant de supprimer)
  for (const id of [idJ7, idJ2, idJ5, idJ8, idTemoin]) {
    const intervention = await getInterventionById(id);
    await db.execute({ sql: "DELETE FROM evenements WHERE intervention_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM intervention_creneaux WHERE intervention_id = ?", args: [id] });
    await db.execute({ sql: "UPDATE interventions SET creneau_confirme_id = NULL WHERE id = ?", args: [id] });
    if (intervention?.creneau_confirme_id) {
      await db.execute({
        sql: "UPDATE creneaux SET intervention_confirmee_id = NULL WHERE id = ?",
        args: [intervention.creneau_confirme_id],
      });
      await db.execute({ sql: "DELETE FROM creneaux WHERE id = ?", args: [intervention.creneau_confirme_id] });
    }
    await db.execute({ sql: "DELETE FROM interventions WHERE id = ?", args: [id] });
  }
  console.log("Nettoyage terminé.");
}

main().catch((err) => {
  console.error("ECHEC:", err);
  process.exit(1);
});
