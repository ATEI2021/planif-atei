import type { StatutIntervention } from "@/db/types";

const LABELS: Record<StatutIntervention, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  confirmee: "Confirmée",
  en_veto: "En veto",
  a_recontacter: "À recontacter",
  sans_reponse: "Sans réponse",
  annulee: "Annulée",
};

const COLORS: Record<StatutIntervention, string> = {
  brouillon: "bg-gray-100 text-gray-700",
  envoyee: "bg-blue-100 text-blue-700",
  confirmee: "bg-green-100 text-green-700",
  en_veto: "bg-orange-100 text-orange-700",
  a_recontacter: "bg-purple-100 text-purple-700",
  sans_reponse: "bg-red-100 text-red-700",
  annulee: "bg-gray-200 text-gray-500 line-through",
};

export function StatutBadge({ statut }: { statut: StatutIntervention }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[statut]}`}>
      {LABELS[statut]}
    </span>
  );
}
