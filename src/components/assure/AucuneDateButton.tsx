"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aucuneDateConvient } from "@/lib/actions/assure";

export function AucuneDateButton({ token }: { token: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleClick() {
    setEnCours(true);
    setErreur(null);
    const resultat = await aucuneDateConvient(token);
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Une erreur est survenue.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={enCours}
        className="w-full rounded border border-gray-300 py-2.5 text-sm text-gray-600 disabled:opacity-50"
      >
        {enCours ? "Envoi..." : "Aucune date ne me convient"}
      </button>
      {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
