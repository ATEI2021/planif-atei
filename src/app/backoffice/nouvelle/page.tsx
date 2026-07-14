import { InterventionForm } from "@/components/InterventionForm";

export default function NouvelleInterventionPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-6 text-xl font-semibold text-atei-navy">Nouvelle intervention</h1>
      <InterventionForm />
    </main>
  );
}
