"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { choisirCreneau } from "@/lib/actions/assure";
import type { Creneau } from "@/db/types";

function formaterDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function CreneauSelector({
  token,
  creneaux,
  creneauConfirmeId,
}: {
  token: string;
  creneaux: Creneau[];
  creneauConfirmeId: number | null;
}) {
  const router = useRouter();
  const [selectionId, setSelectionId] = useState<number | null>(creneauConfirmeId);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const disponibles = creneaux.filter((c) => c.statut === "libre" || c.id === creneauConfirmeId);

  async function valider() {
    if (!selectionId || selectionId === creneauConfirmeId) return;
    setEnCours(true);
    setErreur(null);
    const resultat = await choisirCreneau(token, selectionId);
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Une erreur est survenue.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="space-y-2">
        {disponibles.map((c) => {
          const actif = selectionId === c.id;
          const estConfirme = c.id === creneauConfirmeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectionId(c.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                actif ? "border-atei-gold bg-amber-50" : "border-gray-200 bg-white"
              }`}
            >
              <span className="block font-medium capitalize text-atei-navy">{formaterDate(c.date)}</span>
              <span className="block text-gray-600">
                {c.heure_debut} – {c.heure_fin}
                {estConfirme && <span className="ml-2 text-atei-gold">(créneau actuel)</span>}
              </span>
            </button>
          );
        })}
        {disponibles.length === 0 && (
          <p className="text-sm text-gray-500">Aucun créneau disponible pour le moment.</p>
        )}
      </div>

      {erreur && <p className="mt-3 text-sm text-red-600">{erreur}</p>}

      {selectionId && selectionId !== creneauConfirmeId && (
        <button
          type="button"
          onClick={valider}
          disabled={enCours}
          className="mt-4 w-full rounded bg-atei-gold py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {enCours ? "Confirmation..." : "Confirmer ce créneau"}
        </button>
      )}
    </div>
  );
}
