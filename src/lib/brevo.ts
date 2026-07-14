const BREVO_API_URL = "https://api.brevo.com/v3";

export interface EnvoiResultat {
  simule: boolean;
}

async function brevoFetch(path: string, body: unknown): Promise<EnvoiResultat> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(`[brevo] BREVO_API_KEY absent — envoi simulé pour ${path}`);
    return { simule: true };
  }

  const res = await fetch(`${BREVO_API_URL}${path}`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Brevo ${path} a échoué (${res.status}) : ${detail}`);
  }

  return { simule: false };
}

function normaliserNumeroFr(numero: string): string {
  const chiffres = numero.replace(/\D/g, "");
  if (chiffres.startsWith("33")) return `+${chiffres}`;
  if (chiffres.startsWith("0")) return `+33${chiffres.slice(1)}`;
  return numero.startsWith("+") ? numero : `+${chiffres}`;
}

export async function envoyerSms(numero: string, texte: string): Promise<EnvoiResultat> {
  return brevoFetch("/transactionalSMS/sms", {
    sender: process.env.BREVO_SMS_SENDER ?? "ATEI",
    recipient: normaliserNumeroFr(numero),
    content: texte,
    type: "transactional",
  });
}

export async function envoyerEmailVincent(sujet: string, texte: string): Promise<EnvoiResultat> {
  const destinataire = process.env.BREVO_EMAIL_TO_VINCENT;
  const expediteur = process.env.BREVO_EMAIL_FROM;
  if (!destinataire || !expediteur) {
    console.warn("[brevo] BREVO_EMAIL_TO_VINCENT ou BREVO_EMAIL_FROM absent — envoi simulé");
    return { simule: true };
  }
  return brevoFetch("/smtp/email", {
    sender: { email: expediteur, name: "ATEI Planif" },
    to: [{ email: destinataire }],
    subject: sujet,
    textContent: texte,
  });
}
