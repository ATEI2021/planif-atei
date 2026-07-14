import { LogoutButton } from "@/components/LogoutButton";

export default function BackofficePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-atei-navy">Back-office ATEI</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-gray-600">
        Liste des interventions à venir ici (étape 3).
      </p>
    </main>
  );
}
