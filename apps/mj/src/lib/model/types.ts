import { FRUIT_TYPES } from '@onepiece/core'

// Registre des types de fiches (D-M1, D-M2, MODELE_DONNEES §3) : chaque type déclare ses champs.
// Le formulaire d'édition, le tableau de propriétés, le sous-titre, les liens et `normalizeProps`
// sont tous dérivés de ce registre. Ajouter un champ ne demande aucune migration SQL.

export const ENTITY_TYPES = [
  'personnage',
  'faction',
  'lieu',
  'fruit',
  'race',
  'classe',
  'evenement',
  'scenario',
  'regle',
  'note',
  'document',
] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const isEntityType = (v: unknown): v is EntityType => ENTITY_TYPES.includes(v as EntityType)

export type FieldKind =
  | { kind: 'text' }
  | { kind: 'longtext' }
  | { kind: 'number' }
  | { kind: 'select'; options: readonly string[] }
  | { kind: 'multiselect'; options: readonly string[] }
  /** Lien vers d'autres fiches ; `inverse` = titre de la section dans le panneau Liens de la fiche visée. */
  | { kind: 'relation'; to: readonly EntityType[]; multiple: boolean; inverse: string }
  /** Bloc de jeu des PNJ (M7) : conservé tel quel en attendant. */
  | { kind: 'gameBlock' }
  /** Fichier du dossier media/ (M6) : conservé tel quel en attendant. */
  | { kind: 'asset'; accept: readonly string[] }

export interface FieldDef {
  key: string
  label: string
  field: FieldKind
  /** Proposé comme filtre de liste (M3). */
  filterable?: boolean
  /** Repris dans le sous-titre de la fiche (« PNJ · Marine · En vie »). */
  inSubtitle?: boolean
}

export interface TypeDef {
  type: EntityType
  label: string
  plural: string
  /** Pictogramme court affiché dans la barre latérale et les listes. */
  icon: string
  fields: FieldDef[]
}

const MERS = ['East Blue', 'West Blue', 'North Blue', 'South Blue', 'Grand Line', 'Nouveau Monde', 'Ciel', 'Sous-marin']
const ALIGNEMENTS = ['Bon', 'Neutre', 'Hostile', 'Chaotique', 'Joueur']

const rel = (to: EntityType[], multiple: boolean, inverse: string): FieldKind => ({ kind: 'relation', to, multiple, inverse })

export const TYPE_DEFS: Record<EntityType, TypeDef> = {
  personnage: {
    type: 'personnage',
    label: 'Personnage',
    plural: 'Personnages',
    icon: '👤',
    fields: [
      { key: 'role', label: 'Rôle', field: { kind: 'select', options: ['PJ', 'PNJ'] }, filterable: true, inSubtitle: true },
      { key: 'etat', label: 'État', field: { kind: 'select', options: ['En vie', 'Mort', 'Inconnu'] }, filterable: true, inSubtitle: true },
      { key: 'alignement', label: 'Alignement', field: { kind: 'select', options: ALIGNEMENTS }, filterable: true },
      {
        key: 'grade',
        label: 'Grade',
        field: {
          kind: 'select',
          options: ['Amiral en chef', 'Amiral', 'Vice-amiral', 'Contre-amiral', 'Sous-amiral', 'Capitaine', 'Shichibukai'],
        },
      },
      { key: 'race', label: 'Race', field: rel(['race'], false, 'Personnages'), filterable: true },
      { key: 'classes', label: 'Classes', field: rel(['classe'], true, 'Personnages') },
      { key: 'fruit', label: 'Fruit du démon', field: rel(['fruit'], false, 'Détenteur') },
      { key: 'factions', label: 'Factions', field: rel(['faction'], true, 'Membres'), filterable: true, inSubtitle: true },
      { key: 'origine', label: 'Origine', field: rel(['lieu'], false, 'Originaires') },
      { key: 'mer', label: "Mer d'origine", field: { kind: 'select', options: MERS } },
      { key: 'technique', label: 'Technique de combat', field: { kind: 'longtext' } },
      { key: 'prime', label: 'Prime', field: { kind: 'number' } },
      { key: 'aFaire', label: 'Fiche à faire', field: { kind: 'select', options: ['Oui'] }, filterable: true },
      { key: 'jeu', label: 'Bloc de jeu', field: { kind: 'gameBlock' } },
    ],
  },
  faction: {
    type: 'faction',
    label: 'Faction',
    plural: 'Factions',
    icon: '🏴',
    fields: [
      {
        key: 'typeFaction',
        label: 'Type',
        field: { kind: 'select', options: ['Équipage pirate', 'Marine', 'Armée révolutionnaire', 'Gouvernement mondial', 'Autre'] },
        filterable: true,
        inSubtitle: true,
      },
      { key: 'chef', label: 'Chef', field: rel(['personnage'], false, 'Chef de') },
      { key: 'navires', label: 'Navire(s)', field: { kind: 'text' } },
    ],
  },
  lieu: {
    type: 'lieu',
    label: 'Lieu',
    plural: 'Lieux',
    icon: '🏝',
    fields: [
      { key: 'partieDe', label: 'Fait partie de', field: rel(['lieu'], false, 'Lieux contenus'), inSubtitle: true },
      { key: 'mer', label: 'Mer', field: { kind: 'select', options: MERS }, filterable: true, inSubtitle: true },
      { key: 'alignement', label: 'Alignement', field: { kind: 'select', options: ALIGNEMENTS } },
      { key: 'affilies', label: 'Personnages affiliés', field: rel(['personnage'], true, 'Lieux affiliés') },
    ],
  },
  fruit: {
    type: 'fruit',
    label: 'Fruit du démon',
    plural: 'Fruits du démon',
    icon: '🍇',
    fields: [
      { key: 'nomJaponais', label: 'Nom japonais', field: { kind: 'text' } },
      { key: 'typeFruit', label: 'Type', field: { kind: 'select', options: FRUIT_TYPES }, filterable: true, inSubtitle: true },
      { key: 'eveil', label: 'Éveil', field: { kind: 'longtext' } },
    ],
  },
  race: {
    type: 'race',
    label: 'Race',
    plural: 'Races',
    icon: '🧬',
    fields: [
      { key: 'avantage', label: 'Avantage', field: { kind: 'longtext' } },
      { key: 'desavantage', label: 'Désavantage', field: { kind: 'longtext' } },
      { key: 'vitaliteBase', label: 'Vitalité de base', field: { kind: 'number' } },
      { key: 'enduranceBase', label: 'Endurance de base', field: { kind: 'number' } },
      { key: 'capacites', label: 'Capacités spéciales', field: { kind: 'longtext' } },
    ],
  },
  classe: {
    type: 'classe',
    label: 'Classe',
    plural: 'Classes',
    icon: '⚔',
    fields: [
      { key: 'avantages', label: 'Avantages', field: { kind: 'longtext' } },
      { key: 'desavantages', label: 'Désavantages', field: { kind: 'longtext' } },
    ],
  },
  evenement: {
    type: 'evenement',
    label: 'Événement',
    plural: 'Événements',
    icon: '📅',
    fields: [
      {
        key: 'categorie',
        label: 'Catégorie',
        field: { kind: 'select', options: ['Historique', 'Récurrent', 'Campagne'] },
        filterable: true,
        inSubtitle: true,
      },
      { key: 'dateMonde', label: 'Date dans le monde', field: { kind: 'text' }, inSubtitle: true },
      { key: 'lieux', label: 'Lieux', field: rel(['lieu'], true, 'Événements') },
      { key: 'personnages', label: 'Personnages', field: rel(['personnage'], true, 'Événements') },
    ],
  },
  scenario: {
    type: 'scenario',
    label: 'Scénario',
    plural: 'Scénarios',
    icon: '📜',
    fields: [
      {
        key: 'statut',
        label: 'Statut',
        field: { kind: 'select', options: ['En préparation', 'En cours', 'Joué'] },
        filterable: true,
        inSubtitle: true,
      },
      { key: 'pnj', label: 'PNJ', field: rel(['personnage'], true, 'Scénarios') },
      { key: 'lieux', label: 'Lieux', field: rel(['lieu'], true, 'Scénarios') },
    ],
  },
  regle: {
    type: 'regle',
    label: 'Règle',
    plural: 'Règles',
    icon: '📏',
    fields: [{ key: 'section', label: 'Section', field: { kind: 'text' }, inSubtitle: true }],
  },
  note: { type: 'note', label: 'Note', plural: 'Notes', icon: '📝', fields: [] },
  document: {
    type: 'document',
    label: 'Document',
    plural: 'Documents',
    icon: '🗺',
    fields: [
      { key: 'fichier', label: 'Fichier', field: { kind: 'asset', accept: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] } },
      { key: 'legende', label: 'Légende', field: { kind: 'text' } },
      { key: 'rattacheA', label: 'Rattaché à', field: rel([...ENTITY_TYPES], true, 'Documents') },
    ],
  },
}

/** Champ d'un type par sa clé. */
export const fieldOf = (type: EntityType, key: string): FieldDef | undefined =>
  TYPE_DEFS[type].fields.find(f => f.key === key)
