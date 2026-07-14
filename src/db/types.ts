export type StatutIntervention =
  | "brouillon"
  | "envoyee"
  | "confirmee"
  | "en_veto"
  | "a_recontacter"
  | "sans_reponse"
  | "annulee";

export type StatutCreneau = "libre" | "pris";

export type TypeEvenement =
  | "sms_envoye"
  | "sms_echec"
  | "email_envoye"
  | "creneau_choisi"
  | "modification"
  | "annulation"
  | "veto"
  | "aucune_date_convient"
  | "rappel_j7"
  | "rappel_j2"
  | "relance_j5"
  | "alerte_j8";

export type AuteurEvenement = "systeme" | "assure" | "vincent";

export interface Intervention {
  id: number;
  reference_sinistre: string;
  compagnie: string;
  assure_nom: string;
  assure_telephone: string;
  adresse_chantier: string;
  duree_prevue: string;
  preparatifs_liste: string; // JSON string, array de chaînes
  preparatifs_libre: string;
  statut: StatutIntervention;
  fenetre_modification_jours: number;
  creneau_confirme_id: number | null;
  token: string;
  token_expire_at: string | null;
  veto_deadline_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Creneau {
  id: number;
  date: string; // YYYY-MM-DD
  heure_debut: string; // HH:MM
  heure_fin: string; // HH:MM
  statut: StatutCreneau;
  intervention_confirmee_id: number | null;
  created_at: string;
}

export interface Evenement {
  id: number;
  intervention_id: number;
  type: TypeEvenement;
  detail: string;
  auteur: AuteurEvenement;
  created_at: string;
}
