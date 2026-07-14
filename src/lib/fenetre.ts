export function dateLimiteModification(dateCreneau: string, fenetreJours: number): Date {
  const limite = new Date(`${dateCreneau}T00:00:00`);
  limite.setDate(limite.getDate() - fenetreJours);
  return limite;
}

export function modificationEncorePossible(dateCreneau: string, fenetreJours: number): boolean {
  return new Date() < dateLimiteModification(dateCreneau, fenetreJours);
}
