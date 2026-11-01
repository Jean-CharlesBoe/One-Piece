// Instantané pris au démarrage d'une session (D-M13, cahier §5.2) : bloc de jeu et état de chaque PNJ qui a un
// bloc de jeu. Il sert au bouton « Remettre à l'état de début de session », par PNJ ou pour tous, pendant la
// session et après. Gardé en JSON dans `sessions.snapshot`.

export interface SnapshotItem {
  /** Bloc de jeu tel qu'au démarrage. */
  jeu: unknown
  /** État (« En vie », « Mort »…) tel qu'au démarrage, ou null. */
  etat: string | null
}
export type Snapshot = Record<string, SnapshotItem>

interface WithProps {
  id: string
  type: string
  props: Record<string, unknown>
}

export function takeSnapshot(entries: readonly WithProps[]): Snapshot {
  const out: Snapshot = {}
  for (const e of entries) {
    if (e.type !== 'personnage' || !e.props.jeu) continue
    // Copie par JSON : les fiches du catalogue peuvent être des objets réactifs (structuredClone les refuse).
    out[e.id] = { jeu: JSON.parse(JSON.stringify(e.props.jeu)) as unknown, etat: typeof e.props.etat === 'string' ? e.props.etat : null }
  }
  return out
}

export function parseSnapshot(json: string | null): Snapshot {
  if (!json) return {}
  try {
    const raw = JSON.parse(json) as unknown
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: Snapshot = {}
    for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
      const item = v as Record<string, unknown> | null
      if (item && typeof item === 'object' && item.jeu) out[id] = { jeu: item.jeu, etat: typeof item.etat === 'string' ? item.etat : null }
    }
    return out
  } catch {
    return {}
  }
}

/** Comparaison indépendante de l'ordre des clés. */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  if (ka.length !== kb.length) return false
  return ka.every(k => same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

/** PNJ dont le bloc de jeu ou l'état a changé depuis l'instantané. */
export function changedSince(snapshot: Snapshot, entries: readonly WithProps[]): string[] {
  const byId = new Map(entries.map(e => [e.id, e]))
  return Object.entries(snapshot)
    .filter(([id, s]) => {
      const e = byId.get(id)
      if (!e) return false
      const etat = typeof e.props.etat === 'string' ? e.props.etat : null
      return etat !== s.etat || !same(e.props.jeu, s.jeu)
    })
    .map(([id]) => id)
}

/** Remet la fiche à l'état de l'instantané (modifie l'objet reçu). */
export function restoreItem(props: Record<string, unknown>, item: SnapshotItem): void {
  props.jeu = JSON.parse(JSON.stringify(item.jeu)) as unknown
  if (item.etat === null) delete props.etat
  else props.etat = item.etat
}
