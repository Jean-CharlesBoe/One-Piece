import { ENTITY_TYPES, TYPE_DEFS, type EntityType } from './types'

// Onglets de liste (D-M27) : « liste:<type> », « liste:archives », « liste:doublons ». Les autres onglets portent
// l'identifiant d'une fiche, ou « session:<id> » (model/session.ts).

export type ListMode = EntityType | 'archives' | 'doublons'

const PREFIX = 'liste:'
const MODES: readonly string[] = [...ENTITY_TYPES, 'archives', 'doublons']

export const listTab = (mode: ListMode) => `${PREFIX}${mode}`

export function listModeOfTab(tab: string): ListMode | null {
  if (!tab.startsWith(PREFIX)) return null
  const m = tab.slice(PREFIX.length)
  return MODES.includes(m) ? (m as ListMode) : null
}

export const isListTab = (tab: string) => tab.startsWith(PREFIX)

export function listLabel(mode: ListMode): { title: string; icon: string } {
  if (mode === 'archives') return { title: 'Archives', icon: '🗄' }
  if (mode === 'doublons') return { title: 'Doublons probables', icon: '🔀' }
  return { title: TYPE_DEFS[mode].plural, icon: TYPE_DEFS[mode].icon }
}
