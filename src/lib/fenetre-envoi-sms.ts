// Regle CDC : SMS envoyes entre 9h et 19h uniquement, jamais le dimanche.
// S'applique aux envois proactifs (invitation, renvoi, rappels, relances),
// pas a la confirmation immediate declenchee par l'assure lui-meme.
export function dansFenetreEnvoiSms(date: Date = new Date()): boolean {
  const jour = date.getDay(); // 0 = dimanche
  const heure = date.getHours();
  if (jour === 0) return false;
  return heure >= 9 && heure < 19;
}
