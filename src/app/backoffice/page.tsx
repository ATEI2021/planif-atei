import Link from "next/link";
import { listInterventions } from "@/db/interventions";
import { StatutBadge } from "@/components/StatutBadge";
import { LogoutButton } from "@/components/LogoutButton";

export default async function BackofficePage() {
  const interventions = await listInterventions();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-atei-navy">Back-office ATEI</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/backoffice/nouvelle"
            className="rounded bg-atei-gold px-4 py-2 text-sm font-medium text-white"
          >
            + Nouvelle intervention
          </Link>
          <LogoutButton />
        </div>
      </div>

      {interventions.length === 0 ? (
        <p className="text-sm text-gray-600">Aucune intervention pour le moment.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Référence</th>
                <th className="px-4 py-2">Compagnie</th>
                <th className="px-4 py-2">Assuré</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((intervention) => (
                <tr key={intervention.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/backoffice/${intervention.id}`} className="font-medium text-atei-navy">
                      {intervention.reference_sinistre}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{intervention.compagnie}</td>
                  <td className="px-4 py-2">{intervention.assure_nom}</td>
                  <td className="px-4 py-2">
                    <StatutBadge statut={intervention.statut} />
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(intervention.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
