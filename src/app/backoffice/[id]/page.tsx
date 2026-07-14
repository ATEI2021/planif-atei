import Link from "next/link";
import { notFound } from "next/navigation";
import { getInterventionById } from "@/db/interventions";
import { listCreneauxProposes } from "@/db/creneaux";
import { listEvenements } from "@/db/evenements";
import { StatutBadge } from "@/components/StatutBadge";
import {
  ajouterCreneauAction,
  annulerIntervention,
  dupliquerIntervention,
  envoyerInvitation,
  renvoyerSms,
  vetoIntervention,
} from "@/lib/actions/interventions";

const EVENEMENT_LABELS: Record<string, string> = {
  sms_envoye: "SMS envoyé",
  sms_echec: "Échec SMS",
  email_envoye: "Email envoyé",
  creneau_choisi: "Créneau choisi",
  modification: "Modification",
  annulation: "Annulation",
  veto: "Veto",
  aucune_date_convient: "Aucune date ne convient",
  rappel_j7: "Rappel J-7",
  rappel_j2: "Rappel J-2",
  relance_j5: "Relance J+5",
  alerte_j8: "Alerte J+8",
};

export const dynamic = "force-dynamic";

export default async function InterventionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interventionId = Number(id);
  const intervention = await getInterventionById(interventionId);
  if (!intervention) notFound();

  const creneaux = await listCreneauxProposes(interventionId);
  const evenements = await listEvenements(interventionId);
  const preparatifs: string[] = JSON.parse(intervention.preparatifs_liste);

  const vetoPossible =
    intervention.statut === "confirmee" &&
    intervention.veto_deadline_at !== null &&
    new Date(intervention.veto_deadline_at) > new Date();

  const renvoiPossible = intervention.statut !== "confirmee" && intervention.statut !== "annulee";
  const annulationPossible = intervention.statut !== "annulee";

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Link href="/backoffice" className="mb-4 inline-block text-sm text-atei-navy underline">
        ← Retour à la liste
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-atei-navy">
          {intervention.reference_sinistre} — {intervention.compagnie}
        </h1>
        <StatutBadge statut={intervention.statut} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Détails</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-gray-500">Assuré</dt>
              <dd>{intervention.assure_nom}</dd>
              <dt className="text-gray-500">Téléphone</dt>
              <dd>{intervention.assure_telephone}</dd>
              <dt className="text-gray-500">Adresse</dt>
              <dd>{intervention.adresse_chantier}</dd>
              <dt className="text-gray-500">Durée prévue</dt>
              <dd>{intervention.duree_prevue}</dd>
              <dt className="text-gray-500">Fenêtre de modification</dt>
              <dd>J-{intervention.fenetre_modification_jours}</dd>
              <dt className="text-gray-500">Lien assuré</dt>
              <dd className="truncate text-atei-navy">/t/{intervention.token}</dd>
            </dl>

            {(preparatifs.length > 0 || intervention.preparatifs_libre) && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Préparatifs</h3>
                {preparatifs.length > 0 && (
                  <ul className="mb-2 list-inside list-disc text-sm">
                    {preparatifs.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}
                {intervention.preparatifs_libre && (
                  <p className="text-sm text-gray-600">{intervention.preparatifs_libre}</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Créneaux proposés</h2>
            <ul className="mb-4 space-y-1 text-sm">
              {creneaux.map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <span>
                    {new Date(c.date).toLocaleDateString("fr-FR")} — {c.heure_debut} à {c.heure_fin}
                  </span>
                  <span className={c.statut === "pris" ? "text-green-600" : "text-gray-400"}>
                    {c.statut === "pris" ? "Pris" : "Libre"}
                  </span>
                </li>
              ))}
              {creneaux.length === 0 && <li className="text-gray-400">Aucun créneau proposé.</li>}
            </ul>

            {intervention.statut !== "confirmee" && intervention.statut !== "annulee" && (
              <form action={ajouterCreneauAction.bind(null, interventionId)} className="flex gap-2">
                <input type="date" name="date" required className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
                <button type="submit" className="rounded border border-atei-navy px-3 text-sm text-atei-navy">
                  Ajouter
                </button>
              </form>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Historique</h2>
            <ul className="space-y-2 text-sm">
              {evenements.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{EVENEMENT_LABELS[e.type] ?? e.type}</span>
                    <span className="text-gray-500"> ({e.auteur})</span>
                    {e.detail && <p className="text-gray-500">{e.detail}</p>}
                  </div>
                  <span className="whitespace-nowrap text-gray-400">
                    {new Date(e.created_at).toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
              {evenements.length === 0 && <li className="text-gray-400">Aucun événement.</li>}
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Actions</h2>
            <div className="space-y-2">
              {intervention.statut === "brouillon" && (
                <form action={envoyerInvitation.bind(null, interventionId)}>
                  <button type="submit" className="w-full rounded bg-atei-gold py-2 text-sm font-medium text-white">
                    Envoyer l&apos;invitation
                  </button>
                </form>
              )}

              {renvoiPossible && intervention.statut !== "brouillon" && (
                <form action={renvoyerSms.bind(null, interventionId)}>
                  <button type="submit" className="w-full rounded border border-atei-navy py-2 text-sm text-atei-navy">
                    Renvoyer le SMS
                  </button>
                </form>
              )}

              {vetoPossible && (
                <form action={vetoIntervention.bind(null, interventionId)}>
                  <button type="submit" className="w-full rounded border border-orange-500 py-2 text-sm text-orange-600">
                    Veto (annule et repropose)
                  </button>
                </form>
              )}

              <form action={dupliquerIntervention.bind(null, interventionId)}>
                <button type="submit" className="w-full rounded border border-gray-300 py-2 text-sm text-gray-700">
                  Dupliquer
                </button>
              </form>

              {annulationPossible && (
                <form action={annulerIntervention.bind(null, interventionId)} className="space-y-2 border-t border-gray-100 pt-3">
                  <textarea
                    name="motif"
                    required
                    placeholder="Motif de l'annulation"
                    rows={2}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <button type="submit" className="w-full rounded border border-red-500 py-2 text-sm text-red-600">
                    Annuler l&apos;intervention
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
