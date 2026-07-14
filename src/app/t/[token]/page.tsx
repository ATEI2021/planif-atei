import { notFound } from "next/navigation";
import { getInterventionByToken } from "@/db/interventions";
import { listCreneauxProposes } from "@/db/creneaux";
import { CreneauSelector } from "@/components/assure/CreneauSelector";
import { AucuneDateButton } from "@/components/assure/AucuneDateButton";
import { modificationEncorePossible } from "@/lib/fenetre";

export const dynamic = "force-dynamic";

const ATEI_TEL = "07 89 79 89 77";
const ATEI_EMAIL = "ateipro@hotmail.com";

export default async function PageAssure({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const intervention = await getInterventionByToken(token);
  if (!intervention) notFound();

  if (intervention.statut === "brouillon") {
    return (
      <MessagePage titre="Lien pas encore actif">
        Ce lien n&apos;est pas encore actif. Merci de contacter ATEI au {ATEI_TEL}.
      </MessagePage>
    );
  }

  if (intervention.statut === "annulee") {
    return (
      <MessagePage titre="Intervention annulée">
        Cette intervention a été annulée. Pour toute question, contactez ATEI au {ATEI_TEL}.
      </MessagePage>
    );
  }

  const creneaux = await listCreneauxProposes(intervention.id);
  const preparatifs: string[] = JSON.parse(intervention.preparatifs_liste);
  const creneauConfirme = creneaux.find((c) => c.id === intervention.creneau_confirme_id);

  const modifiable =
    intervention.statut !== "confirmee" ||
    (creneauConfirme
      ? modificationEncorePossible(creneauConfirme.date, intervention.fenetre_modification_jours)
      : false);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 rounded-lg bg-atei-navy p-5 text-white">
          <p className="text-xs uppercase tracking-wide text-white/70">{intervention.compagnie} — {intervention.reference_sinistre}</p>
          <h1 className="mt-1 text-lg font-semibold">Intervention ATEI</h1>
          <p className="mt-2 text-sm text-white/90">{intervention.adresse_chantier}</p>
          <p className="text-sm text-white/90">Durée prévue : {intervention.duree_prevue}</p>
        </div>

        {(preparatifs.length > 0 || intervention.preparatifs_libre) && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-atei-navy">À préparer avant l&apos;intervention</h2>
            {preparatifs.length > 0 && (
              <ul className="mb-2 list-inside list-disc text-sm text-gray-700">
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

        {intervention.statut === "a_recontacter" && (
          <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
            Nous avons bien noté qu&apos;aucune date ne vous convenait. ATEI va vous recontacter — vous pouvez
            aussi choisir un créneau ci-dessous s&apos;il y en a un qui vous convient.
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-atei-navy">
            {intervention.statut === "confirmee" ? "Votre créneau" : "Choisissez votre créneau"}
          </h2>

          {modifiable ? (
            <>
              <CreneauSelector
                token={token}
                creneaux={creneaux}
                creneauConfirmeId={intervention.creneau_confirme_id}
              />
              {intervention.statut !== "confirmee" && <AucuneDateButton token={token} />}
            </>
          ) : (
            creneauConfirme && (
              <div>
                <p className="text-sm text-gray-700">
                  Intervention confirmée le{" "}
                  <span className="font-medium capitalize">
                    {new Date(`${creneauConfirme.date}T00:00:00`).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>{" "}
                  de {creneauConfirme.heure_debut} à {creneauConfirme.heure_fin}.
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  La fenêtre de modification en ligne est dépassée. Pour tout changement, contactez ATEI au{" "}
                  {ATEI_TEL}.
                </p>
              </div>
            )
          )}
        </div>

        <PiedRgpd />
      </div>
    </main>
  );
}

function MessagePage({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center">
        <h1 className="mb-2 text-lg font-semibold text-atei-navy">{titre}</h1>
        <p className="text-sm text-gray-600">{children}</p>
      </div>
    </main>
  );
}

function PiedRgpd() {
  return (
    <p className="mt-8 text-center text-xs text-gray-400">
      Vos données (nom, téléphone, adresse, référence sinistre) sont utilisées dans le cadre de
      l&apos;exécution de l&apos;intervention mandatée par votre assureur, et conservées 5 ans. Aucun
      cookie ni traceur sur cette page. ATEI — {ATEI_TEL} — {ATEI_EMAIL}
    </p>
  );
}
