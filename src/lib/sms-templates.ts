// Textes sans accents (GSM-7, evite le fractionnement UCS-2 des SMS).

export function smsInvitation(params: {
  compagnie: string;
  ref: string;
  lien: string;
  duree: string;
}): string {
  return `ATEI, mandate par ${params.compagnie} - Sinistre ${params.ref}. Choisissez la date de votre intervention : ${params.lien}. Duree prevue : ${params.duree}.`;
}

export function smsConfirmation(params: {
  compagnie: string;
  ref: string;
  date: string;
  debut: string;
  fin: string;
  lien: string;
}): string {
  return `ATEI (${params.compagnie} - ${params.ref}) - Intervention confirmee le ${params.date} de ${params.debut} a ${params.fin}. Preparatifs et details : ${params.lien}.`;
}
