"use client";

import { useState } from "react";
import { creerIntervention } from "@/lib/actions/interventions";
import { HEURE_DEBUT_DEFAUT, HEURE_FIN_DEFAUT } from "@/lib/horaires";

export interface ValeursInitiales {
  reference_sinistre?: string;
  compagnie?: string;
  assure_nom?: string;
  assure_telephone?: string;
  adresse_chantier?: string;
  duree_prevue?: string;
  preparatifs_liste?: string[];
  preparatifs_libre?: string;
  fenetre_modification_jours?: number;
}

const COMPAGNIES = ["PACIFICA", "VIAREN", "REPARTIM", "DYNAREN"];

export function InterventionForm({ valeursInitiales = {} }: { valeursInitiales?: ValeursInitiales }) {
  const [creneaux, setCreneaux] = useState(["", "", ""]);
  const [preparatifs, setPreparatifs] = useState<string[]>(valeursInitiales.preparatifs_liste ?? [""]);

  return (
    <form action={creerIntervention} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Référence sinistre</label>
          <input
            name="reference_sinistre"
            required
            defaultValue={valeursInitiales.reference_sinistre}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Compagnie</label>
          <input
            name="compagnie"
            required
            list="compagnies"
            defaultValue={valeursInitiales.compagnie}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <datalist id="compagnies">
            {COMPAGNIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Nom de l&apos;assuré</label>
          <input
            name="assure_nom"
            required
            defaultValue={valeursInitiales.assure_nom}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Téléphone mobile</label>
          <input
            name="assure_telephone"
            required
            defaultValue={valeursInitiales.assure_telephone}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-700">Adresse du chantier</label>
        <input
          name="adresse_chantier"
          required
          defaultValue={valeursInitiales.adresse_chantier}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Durée prévue (jours)</label>
          <input
            name="duree_prevue"
            required
            placeholder="ex. 3 jours"
            defaultValue={valeursInitiales.duree_prevue}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Fenêtre de modification (jours avant)</label>
          <input
            type="number"
            name="fenetre_modification_jours"
            min={1}
            defaultValue={valeursInitiales.fenetre_modification_jours ?? 10}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-gray-700">Préparatifs (liste à cocher pour l&apos;assuré)</label>
        {preparatifs.map((item, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              name="preparatif"
              value={item}
              onChange={(e) => {
                const copie = [...preparatifs];
                copie[i] = e.target.value;
                setPreparatifs(copie);
              }}
              placeholder="ex. Dégager l'accès"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setPreparatifs(preparatifs.filter((_, idx) => idx !== i))}
              className="px-2 text-gray-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPreparatifs([...preparatifs, ""])}
          className="text-sm text-atei-navy underline"
        >
          + Ajouter un préparatif
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-700">Préparatifs (notes libres)</label>
        <textarea
          name="preparatifs_libre"
          defaultValue={valeursInitiales.preparatifs_libre}
          rows={2}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-700">Créneaux proposés (3 à 5)</label>
        <p className="mb-2 text-xs text-gray-500">Horaires fixes {HEURE_DEBUT_DEFAUT}–{HEURE_FIN_DEFAUT}</p>
        {creneaux.map((date, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              type="date"
              name="creneau_date"
              value={date}
              onChange={(e) => {
                const copie = [...creneaux];
                copie[i] = e.target.value;
                setCreneaux(copie);
              }}
              className="rounded border border-gray-300 px-2 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setCreneaux(creneaux.filter((_, idx) => idx !== i))}
              className="px-2 text-gray-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
        {creneaux.length < 5 && (
          <button
            type="button"
            onClick={() => setCreneaux([...creneaux, ""])}
            className="text-sm text-atei-navy underline"
          >
            + Ajouter un créneau
          </button>
        )}
      </div>

      <button
        type="submit"
        className="rounded bg-atei-gold px-6 py-2.5 text-sm font-medium text-white"
      >
        Créer l&apos;intervention
      </button>
    </form>
  );
}
