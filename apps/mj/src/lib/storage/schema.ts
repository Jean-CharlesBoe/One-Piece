// Schéma SQLite de l'appli MJ (docs/mj/MODELE_DONNEES.md §2).
// Migrations appliquées dans l'ordre ; ne jamais modifier une migration publiée : en ajouter une à la fin.

export const MIGRATIONS: string[] = [
  // 1 — toutes les tables sauf l'index de recherche, créé à part (D-M11, voir SEARCH_INDEX_DDL).
  `CREATE TABLE IF NOT EXISTS meta (
     key   TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS assets (
     id            TEXT PRIMARY KEY NOT NULL,
     file_name     TEXT NOT NULL,
     original_name TEXT NOT NULL,
     mime          TEXT NOT NULL,
     size          INTEGER NOT NULL,
     width         INTEGER,
     height        INTEGER,
     created_at    TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS entities (
     id          TEXT PRIMARY KEY NOT NULL,
     type        TEXT NOT NULL,
     title       TEXT NOT NULL,
     aliases     TEXT NOT NULL DEFAULT '[]',
     parent_id   TEXT REFERENCES entities(id) ON DELETE SET NULL,
     sort_order  REAL NOT NULL DEFAULT 0,
     props       TEXT NOT NULL DEFAULT '{}',
     body_md     TEXT NOT NULL DEFAULT '',
     tags        TEXT NOT NULL DEFAULT '[]',
     cover_asset TEXT REFERENCES assets(id) ON DELETE SET NULL,
     pinned      INTEGER NOT NULL DEFAULT 0,
     archived    INTEGER NOT NULL DEFAULT 0,
     notion_id   TEXT,
     created_at  TEXT NOT NULL,
     updated_at  TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS entities_type   ON entities(type, archived, title);
   CREATE INDEX IF NOT EXISTS entities_parent ON entities(parent_id, sort_order);
   CREATE TABLE IF NOT EXISTS links (
     from_kind TEXT NOT NULL,
     from_id   TEXT NOT NULL,
     to_id     TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
     kind      TEXT NOT NULL,
     PRIMARY KEY (from_kind, from_id, to_id, kind)
   );
   CREATE INDEX IF NOT EXISTS links_to ON links(to_id);
   CREATE TABLE IF NOT EXISTS campaigns (
     id             TEXT PRIMARY KEY NOT NULL,
     title          TEXT NOT NULL,
     description_md TEXT NOT NULL DEFAULT '',
     created_at     TEXT NOT NULL,
     updated_at     TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS sessions (
     id          TEXT PRIMARY KEY NOT NULL,
     campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
     number      INTEGER NOT NULL,
     title       TEXT NOT NULL DEFAULT '',
     played_on   TEXT,
     scenario_id TEXT REFERENCES entities(id) ON DELETE SET NULL,
     status      TEXT NOT NULL DEFAULT 'prevue',
     prep_md     TEXT NOT NULL DEFAULT '',
     summary_md  TEXT NOT NULL DEFAULT '',
     pinned_ids  TEXT NOT NULL DEFAULT '[]',
     snapshot    TEXT,
     created_at  TEXT NOT NULL,
     updated_at  TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS journal_entries (
     id         TEXT PRIMARY KEY NOT NULL,
     session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
     at         TEXT NOT NULL,
     kind       TEXT NOT NULL DEFAULT 'evenement',
     text_md    TEXT NOT NULL,
     auto       TEXT,
     haki       TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS journal_session ON journal_entries(session_id, at);
   CREATE TABLE IF NOT EXISTS not_duplicates (
     a_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
     b_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
     PRIMARY KEY (a_id, b_id)
   );`,
]

/**
 * Index plein texte (D-M11) : donnée dérivée, hors migrations, créée à l'ouverture avec le meilleur moteur
 * disponible. FTS5 sur l'appareil s'il existe (à vérifier en M1) ; FTS4 sinon (c'est le cas de sql.js,
 * le moteur du repli web) ; à défaut, aucune table et une recherche `LIKE` (M3).
 */
export const SEARCH_ENGINES = ['fts5', 'fts4', 'aucun'] as const
export type SearchEngine = (typeof SEARCH_ENGINES)[number]

export const SEARCH_INDEX_DDL: Record<Exclude<SearchEngine, 'aucun'>, string> = {
  fts5: `CREATE VIRTUAL TABLE search_index USING fts5(
           entity_id UNINDEXED, title, aliases, props_text, body_text,
           tokenize = 'unicode61 remove_diacritics 2')`,
  fts4: `CREATE VIRTUAL TABLE search_index USING fts4(
           entity_id, title, aliases, props_text, body_text,
           notindexed=entity_id, tokenize=unicode61 "remove_diacritics=2")`, // FTS4 : pas d'espace autour des « = »
}
