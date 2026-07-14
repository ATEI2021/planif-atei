import { Suspense } from "react";
import { ConnexionForm } from "@/components/ConnexionForm";

export default function ConnexionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-atei-navy px-4">
      <Suspense>
        <ConnexionForm />
      </Suspense>
    </main>
  );
}
