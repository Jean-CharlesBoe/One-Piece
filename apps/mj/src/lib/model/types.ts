// Registre des types de fiches (D-M1, D-M2, MODELE_DONNEES §3).
// M0 : identité de chaque type seulement. Les champs propres à chaque type (props) arrivent en M2.

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

export interface TypeDef {
  type: EntityType
  label: string
  plural: string
  /** Pictogramme court affiché dans la barre latérale et les listes. */
  icon: string
}

export const TYPE_DEFS: Record<EntityType, TypeDef> = {
  personnage: { type: 'personnage', label: 'Personnage', plural: 'Personnages', icon: '👤' },
  faction: { type: 'faction', label: 'Faction', plural: 'Factions', icon: '🏴' },
  lieu: { type: 'lieu', label: 'Lieu', plural: 'Lieux', icon: '🏝' },
  fruit: { type: 'fruit', label: 'Fruit du démon', plural: 'Fruits du démon', icon: '🍇' },
  race: { type: 'race', label: 'Race', plural: 'Races', icon: '🧬' },
  classe: { type: 'classe', label: 'Classe', plural: 'Classes', icon: '⚔' },
  evenement: { type: 'evenement', label: 'Événement', plural: 'Événements', icon: '📅' },
  scenario: { type: 'scenario', label: 'Scénario', plural: 'Scénarios', icon: '📜' },
  regle: { type: 'regle', label: 'Règle', plural: 'Règles', icon: '📏' },
  note: { type: 'note', label: 'Note', plural: 'Notes', icon: '📝' },
  document: { type: 'document', label: 'Document', plural: 'Documents', icon: '🗺' },
}
