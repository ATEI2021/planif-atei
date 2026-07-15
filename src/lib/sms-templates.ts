// Textes sans accents (GSM-7, evite le fractionnement UCS-2 des SMS).

export function smsInvitation(params: {
  compagnie: string;
  ref: string;
  lien: string;
  duree: string;
}): string {
  return `SARL ATEI mandate par ${params.compagnie} - Dossier ${params.ref} vous invite a choisir les jours d'intervention. Duree travaux : ${params.duree}. ${params.lien}`;
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

export function smsRappelJ7(params: {
  compagnie: string;
  ref: string;
  date: string;
  dateLimite: string;
  lien: string;
}): string {
  return `ATEI (${params.compagnie} - ${params.ref}) - Rappel : intervention le ${params.date}. Modifier (jusqu'au ${params.dateLimite}) : ${params.lien}.`;
}

export function smsRappelJ2(params: {
  compagnie: string;
  ref: string;
  date: string;
  heure: string;
  preparatifsCourts: string;
  lien: string;
}): string {
  return `ATEI (${params.compagnie} - ${params.ref}) - Intervention apres-demain ${params.date} a ${params.heure}. Merci de preparer : ${params.preparatifsCourts}. Details : ${params.lien}.`;
}

export function smsRelanceJ5(params: { compagnie: string; ref: string; lien: string }): string {
  return `ATEI, mandate par ${params.compagnie} - Sinistre ${params.ref} : vous n'avez pas encore choisi de date pour votre intervention : ${params.lien}.`;
}
