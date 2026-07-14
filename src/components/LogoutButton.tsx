"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded border border-atei-navy px-3 py-1.5 text-sm text-atei-navy"
    >
      Se déconnecter
    </button>
  );
}
