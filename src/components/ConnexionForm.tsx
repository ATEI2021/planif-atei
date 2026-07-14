"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setEnCours(false);

    if (!res.ok) {
      setErreur("Email ou mot de passe incorrect.");
      return;
    }

    router.push(searchParams.get("next") ?? "/backoffice");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-xl font-semibold text-atei-navy">Back-office ATEI</h1>

      <label className="mb-1 block text-sm text-gray-700">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />

      <label className="mb-1 block text-sm text-gray-700">Mot de passe</label>
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />

      {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="w-full rounded bg-atei-gold py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {enCours ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
