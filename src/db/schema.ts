// Schéma V1 — portail planification interventions ATEI
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS interventions (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_sinistre        TEXT NOT NULL,
  compagnie                 TEXT NOT NULL,
  assure_nom                TEXT NOT NULL,
  assure_telephone          TEXT NOT NULL,
  adresse_chantier          TEXT NOT NULL,
  duree_prevue              TEXT NOT NULL,
  preparatifs_liste         TEXT NOT NULL DEFAULT '[]',
  preparatifs_libre         TEXT NOT NULL DEFAULT '',
  statut                    TEXT NOT NULL DEFAULT 'brouillon'
                             CHECK (statut IN ('brouillon','envoyee','confirmee','en_veto','a_recontacter','sans_reponse','annulee')),
  fenetre_modification_jours INTEGER NOT NULL DEFAULT 7,
  creneau_confirme_id       INTEGER REFERENCES creneaux(id),
  token                     TEXT NOT NULL UNIQUE,
  token_expire_at           TEXT,
  veto_deadline_at          TEXT,
  created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_interventions_token ON interventions(token);

CREATE TABLE IF NOT EXISTS creneaux (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  date                      TEXT NOT NULL,
  heure_debut               TEXT NOT NULL,
  heure_fin                 TEXT NOT NULL,
  statut                    TEXT NOT NULL DEFAULT 'libre' CHECK (statut IN ('libre','pris')),
  intervention_confirmee_id INTEGER REFERENCES interventions(id),
  created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS intervention_creneaux (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL REFERENCES interventions(id),
  creneau_id      INTEGER NOT NULL REFERENCES creneaux(id),
  UNIQUE (intervention_id, creneau_id)
);

CREATE INDEX IF NOT EXISTS idx_intervention_creneaux_intervention ON intervention_creneaux(intervention_id);
CREATE INDEX IF NOT EXISTS idx_intervention_creneaux_creneau ON intervention_creneaux(creneau_id);

CREATE TABLE IF NOT EXISTS evenements (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL REFERENCES interventions(id),
  type            TEXT NOT NULL CHECK (type IN (
                    'sms_envoye','sms_echec','email_envoye','creneau_choisi',
                    'modification','annulation','veto','aucune_date_convient',
                    'rappel_j7','rappel_j2','relance_j5','alerte_j8'
                  )),
  detail          TEXT NOT NULL DEFAULT '',
  auteur          TEXT NOT NULL CHECK (auteur IN ('systeme','assure','vincent')),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_evenements_intervention ON evenements(intervention_id);
`;
