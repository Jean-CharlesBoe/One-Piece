# Appli MJ — modèle de données

> Statut : **proposé** (D-M2). Toute évolution après la 1re release = nouvelle migration (jamais modifier une migration publiée).

## 1. Principes

- Une table générique **`entities`** pour toutes les fiches ; les champs propres à chaque type sont dans `props` (JSON), **décrits et validés par le registre des types** (§3) côté code.
- Les **relations** (propriétés « → ») et les **mentions** `[[ ]]` du texte sont matérialisées dans **`links`** pour les rétroliens et la chronologie. `links` est **dérivée** : recalculée à chaque enregistrement d'une fiche ou d'une entrée de journal (source de vérité = `props` + `body_md`).
- Identifiants : UUID v4 en texte. Dates : ISO 8601 UTC en texte.
- Médias : fichiers dans `Directory.Data/media/`, jamais en base.

## 2. Schéma SQLite (migration 1)

```sql
CREATE TABLE meta (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL                     -- schema_version, last_backup_at, last_change_at…
);

CREATE TABLE entities (
  id          TEXT PRIMARY KEY NOT NULL,
  type        TEXT NOT NULL,              -- personnage | faction | lieu | fruit | race | classe
                                          -- | evenement | scenario | regle | note | document
  title       TEXT NOT NULL,
  aliases     TEXT NOT NULL DEFAULT '[]', -- JSON string[]
  parent_id   TEXT REFERENCES entities(id) ON DELETE SET NULL,  -- pages enfants / hiérarchie
  sort_order  REAL NOT NULL DEFAULT 0,    -- ordre parmi les frères
  props       TEXT NOT NULL DEFAULT '{}', -- JSON validé par le registre des types
  body_md     TEXT NOT NULL DEFAULT '',   -- texte riche en Markdown, liens [[id|Titre]]
  tags        TEXT NOT NULL DEFAULT '[]', -- JSON string[] (étiquettes libres)
  cover_asset TEXT REFERENCES assets(id) ON DELETE SET NULL,
  pinned      INTEGER NOT NULL DEFAULT 0,
  archived    INTEGER NOT NULL DEFAULT 0,
  notion_id   TEXT,                       -- identifiant Notion d'origine (traçabilité de l'import)
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX entities_type   ON entities(type, archived, title);
CREATE INDEX entities_parent ON entities(parent_id, sort_order);

CREATE TABLE links (
  from_kind  TEXT NOT NULL,               -- 'entity' | 'journal'
  from_id    TEXT NOT NULL,
  to_id      TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,               -- 'mention' ou nom de la propriété ('race', 'factions', …)
  PRIMARY KEY (from_kind, from_id, to_id, kind)
);
CREATE INDEX links_to ON links(to_id);

CREATE TABLE assets (
  id          TEXT PRIMARY KEY NOT NULL,
  file_name   TEXT NOT NULL,              -- <id>.<ext> dans media/
  original_name TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  width       INTEGER, height INTEGER,    -- images
  created_at  TEXT NOT NULL
);

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description_md TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id           TEXT PRIMARY KEY NOT NULL,
  campaign_id  TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  number       INTEGER NOT NULL,
  title        TEXT NOT NULL DEFAULT '',
  played_on    TEXT,                      -- date réelle (AAAA-MM-JJ)
  scenario_id  TEXT REFERENCES entities(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'prevue',   -- prevue | en_cours | terminee
  prep_md      TEXT NOT NULL DEFAULT '',
  summary_md   TEXT NOT NULL DEFAULT '',
  pinned_ids   TEXT NOT NULL DEFAULT '[]',       -- JSON string[] : fiches de la session, dans l'ordre
  snapshot     TEXT,                              -- JSON : état des blocs de jeu au démarrage [Q-M3]
  created_at   TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE journal_entries (
  id          TEXT PRIMARY KEY NOT NULL,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  at          TEXT NOT NULL,              -- horodatage réel
  kind        TEXT NOT NULL DEFAULT 'evenement', -- evenement | combat | decouverte | xp | haki | note | auto
  text_md     TEXT NOT NULL,
  auto        TEXT,                       -- JSON des changements automatiques {entityId, field, from, to}
  haki        TEXT,                       -- JSON pour kind = 'haki' : {pjId, type: 'observation'|'armement'|'rois', resultat: 1..100}
  created_at  TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX journal_session ON journal_entries(session_id, at);

-- Paires écartées de la vue « Doublons probables » (a_id < b_id)
CREATE TABLE not_duplicates (
  a_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  b_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (a_id, b_id)
);

```

Recherche plein texte (**hors migrations**, D-M11) : donnée dérivée, créée par le repository à l'ouverture si elle manque, avec le premier moteur accepté par le SQLite de l'appareil, puis remplie depuis `entities`. Le moteur retenu est noté dans `meta.search_engine` (`fts5` | `fts4` | `aucun`) et affiché dans Réglages › À propos.

```sql
-- FTS5 (attendu sur l'appareil, à vérifier en M1)
CREATE VIRTUAL TABLE search_index USING fts5(
  entity_id UNINDEXED, title, aliases, props_text, body_text,
  tokenize = 'unicode61 remove_diacritics 2'
);
-- FTS4 (repli ; c'est le cas de sql.js, moteur du repli web). Pas d'espace autour des « = » des options.
CREATE VIRTUAL TABLE search_index USING fts4(
  entity_id, title, aliases, props_text, body_text,
  notindexed=entity_id, tokenize=unicode61 "remove_diacritics=2"
);
```

Notes :
- Migration 1 = toutes les tables ci-dessus (code : `apps/mj/src/lib/storage/schema.ts`), sans `search_index`.
- `search_index` est alimentée par le repository à chaque enregistrement (M0 : titre, alias et Markdown brut ; à partir de M2 : texte Markdown dépouillé, valeurs de propriétés lisibles, titres des relations). Une fiche archivée en est retirée. Sans moteur plein texte (`aucun`), la recherche se fera par `LIKE` sur une colonne normalisée (minuscules, sans accents) [M3].
- `PRAGMA foreign_keys = ON` à chaque ouverture.
- Le journal est indexé dans une seconde table FTS si la recherche dans le journal est retenue **[Q-M5]**.

## 3. Registre des types (code, `apps/mj/src/lib/model/types.ts`)

Chaque type déclare ses champs ; l'UI (formulaire, tableau de propriétés, filtres) et `normalizeProps` sont générés depuis ce registre. Une clé inconnue du type (après un changement de type) n'est jamais supprimée silencieusement : `normalizeProps` la range dans `props._orphelines` (affichée en lecture seule, supprimable).

```ts
type FieldKind =
  | { kind: 'text' } | { kind: 'longtext' } | { kind: 'number' }
  | { kind: 'select'; options: string[] } | { kind: 'multiselect'; options: string[] }
  | { kind: 'relation'; to: EntityType[]; multiple: boolean }
  | { kind: 'gameBlock' }                       // bloc de jeu des PNJ
  | { kind: 'asset'; accept: string[] }

interface FieldDef { key: string; label: string; field: FieldKind; filterable?: boolean; inSubtitle?: boolean }
interface TypeDef  { type: EntityType; label: string; plural: string; icon: string; fields: FieldDef[]; tree?: boolean }
```

Extrait :

```ts
personnage: [
  { key: 'role',      label: 'Rôle',       field: { kind: 'select', options: ['PJ', 'PNJ'] }, filterable: true, inSubtitle: true },
  { key: 'etat',      label: 'État',       field: { kind: 'select', options: ['En vie', 'Mort', 'Inconnu'] }, filterable: true, inSubtitle: true },
  { key: 'alignement',label: 'Alignement', field: { kind: 'select', options: ['Bon', 'Neutre', 'Hostile', 'Chaotique', 'Joueur'] }, filterable: true },
  { key: 'grade',     label: 'Grade',      field: { kind: 'select', options: ['Amiral en chef', 'Amiral', 'Vice-amiral', 'Contre-amiral', 'Sous-amiral', 'Capitaine', 'Shichibukai'] } },
  { key: 'race',      label: 'Race',       field: { kind: 'relation', to: ['race'], multiple: false }, filterable: true },
  { key: 'classes',   label: 'Classes',    field: { kind: 'relation', to: ['classe'], multiple: true } },
  { key: 'fruit',     label: 'Fruit du démon', field: { kind: 'relation', to: ['fruit'], multiple: false } },
  { key: 'factions',  label: 'Factions',   field: { kind: 'relation', to: ['faction'], multiple: true }, filterable: true, inSubtitle: true },
  { key: 'origine',   label: 'Origine',    field: { kind: 'relation', to: ['lieu'], multiple: false } },
  { key: 'mer',       label: 'Mer',        field: { kind: 'select', options: ['East Blue', 'West Blue', 'North Blue', 'South Blue', 'Grand Line', 'Nouveau Monde', 'Ciel', 'Sous-marin'] } },
  { key: 'technique', label: 'Technique de combat', field: { kind: 'longtext' } },
  { key: 'prime',     label: 'Prime',      field: { kind: 'number' } },
  { key: 'aFaire',    label: 'Fiche à faire', field: { kind: 'select', options: ['Oui'] }, filterable: true },
  { key: 'jeu',       label: 'Bloc de jeu', field: { kind: 'gameBlock' } },
],
```

Bloc de jeu (`props.jeu`), réutilise les types de `packages/core` :

```ts
interface GameBlock {
  palierDe: 'D10' | 'D20' | 'D100'
  stats: Stats; bonusTemporaires: TempBonus[]
  ressources: { vitalite: Resource; endurance: Resource }
  ressourcesPerso: (Resource & { id: string; nom: string; regle: string })[]
  categorie: '' | 'mineur' | 'standard' | 'second' | 'capitaine' | 'commodore' | 'shichibukai' | 'vice-amiral' | 'supernova' | 'amiral' | 'empereur'
  techniques: { id: string; titre: string; cout: number | null; description: string }[]
  haki: Record<'observation' | 'armement' | 'rois', { maitrise: boolean; notes: string }>  // un PNJ est maîtrisé ou non, le MJ décide
  notesRapides: string
}
```

## 4. Liens `[[ ]]` dans le Markdown

- Forme stockée : `[[<id>|<titre affiché>]]` — robuste aux renommages ; le titre affiché est mis à jour au renommage (§4.3 du cahier).
- Forme tapée : `[[Drake` → autocomplétion → insère la forme stockée.
- Lien vers une fiche inexistante (import, saisie) : `[[?|Nom]]` → lien rouge ; clic = créer la fiche et réécrire le lien.
- Images : `![légende](asset:<id>)`, résolues vers le fichier du dossier `media/`.

## 5. Sauvegarde `.opmj`

Archive zip :
```
manifest.json   { format: "onepiece-mj-sauvegarde", version: 1, schemaVersion, exportedAt, appVersion, counts }
data.json       { entities: [], assets: [], campaigns: [], sessions: [], journal_entries: [], not_duplicates: [], meta: {...} }
media/<id>.<ext>
```
`data.json` contient aussi `not_duplicates`. `links` et `search_index` ne sont pas exportés : reconstruits à la restauration. Chaque enregistrement passe par sa fonction `normalize*` à la restauration.
