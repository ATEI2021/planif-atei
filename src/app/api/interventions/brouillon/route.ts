import { NextResponse } from "next/server";
import { createIntervention } from "@/db/interventions";

export const dynamic = "force-dynamic";

const CHAMPS_OBLIGATOIRES = [
  "reference_sinistre",
  "compagnie",
  "assure_nom",
  "assure_telephone",
  "adresse_chantier",
] as const;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.INGESTION_SECRET || authHeader !== `Bearer ${process.env.INGESTION_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const manquants = CHAMPS_OBLIGATOIRES.filter((champ) => !String(body[champ] ?? "").trim());
  if (manquants.length > 0) {
    return NextResponse.json({ error: `Champs manquants : ${manquants.join(", ")}` }, { status: 400 });
  }

  const preparatifsListe = Array.isArray(body.preparatifs_liste)
    ? body.preparatifs_liste.map((p) => String(p))
    : [];

  const intervention = await createIntervention({
    reference_sinistre: String(body.reference_sinistre).trim(),
    compagnie: String(body.compagnie).trim(),
    assure_nom: String(body.assure_nom).trim(),
    assure_telephone: String(body.assure_telephone).trim(),
    adresse_chantier: String(body.adresse_chantier).trim(),
    duree_prevue: String(body.duree_prevue ?? "A confirmer").trim(),
    preparatifs_liste: preparatifsListe,
    preparatifs_libre: String(body.preparatifs_libre ?? "").trim(),
    fenetre_modification_jours: body.fenetre_modification_jours
      ? Number(body.fenetre_modification_jours)
      : undefined,
  });

  return NextResponse.json({
    id: intervention.id,
    token: intervention.token,
    url: `${process.env.APP_URL ?? "http://localhost:3000"}/backoffice/${intervention.id}`,
  });
}
