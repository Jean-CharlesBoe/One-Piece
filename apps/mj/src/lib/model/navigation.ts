// Onglets (D-M14, D-M21, cahier §3), comme dans un navigateur : chaque fiche ouverte a son onglet. Ouvrir une
// fiche ajoute un onglet juste après l'onglet actif, ou revient sur le sien si elle est déjà ouverte. Aucun
// onglet ne se ferme tout seul : seulement par son ✕ (ou le clic molette), ou quand sa fiche disparaît.
// Fonctions pures : elles modifient l'état reçu.

export interface Navigation {
  /** Identifiants des fiches, dans l'ordre des onglets ; chaque fiche une seule fois. */
  tabs: string[]
  active: number
}

export const emptyNavigation = (): Navigation => ({ tabs: [], active: -1 })

/** Fiche affichée par un onglet (ou par l'onglet actif). */
export function currentId(n: Navigation, i = n.active): string | null {
  return n.tabs[i] ?? null
}

export function openIn(n: Navigation, id: string): void {
  const i = n.tabs.indexOf(id)
  if (i >= 0) {
    n.active = i
    return
  }
  n.tabs.splice(n.active + 1, 0, id)
  n.active++
}

export function closeTab(n: Navigation, i: number): void {
  if (i < 0 || i >= n.tabs.length) return
  n.tabs.splice(i, 1)
  if (!n.tabs.length) n.active = -1
  else if (i < n.active || n.active >= n.tabs.length) n.active = Math.max(0, n.active - 1)
}

/** Glisser un onglet à une autre place : l'onglet actif reste actif. */
export function moveTab(n: Navigation, from: number, to: number): void {
  const len = n.tabs.length
  if (from < 0 || from >= len || to < 0 || to >= len || from === to) return
  const activeId = n.tabs[n.active]
  const [t] = n.tabs.splice(from, 1)
  n.tabs.splice(to, 0, t)
  n.active = n.tabs.indexOf(activeId)
}

/** Onglet suivant (`delta` = 1) ou précédent (−1), en boucle : Ctrl+Tab, Ctrl+Maj+Tab. */
export function cycleTab(n: Navigation, delta: number): void {
  const len = n.tabs.length
  if (len < 2) return
  n.active = (((n.active + delta) % len) + len) % len
}

/** Retire les fiches qui n'existent plus (supprimées) ou ne sont plus à afficher : leurs onglets se ferment. */
export function forget(n: Navigation, keep: (id: string) => boolean): void {
  for (let i = n.tabs.length - 1; i >= 0; i--) if (!keep(n.tabs[i])) closeTab(n, i)
}

/**
 * Relit un état sauvegardé (meta « onglets ») ; tout ce qui est illisible est ignoré. Lit aussi l'ancien format
 * (0.3.1 et avant : un historique par onglet), dont seule la fiche affichée est gardée.
 */
export function normalizeNavigation(raw: unknown): Navigation {
  const n = emptyNavigation()
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const tabs = Array.isArray(r.tabs) ? r.tabs : []
  const a = typeof r.active === 'number' && Number.isInteger(r.active) ? r.active : 0
  let activeId: string | null = null
  tabs.forEach((t, i) => {
    let id: unknown = t
    if (t && typeof t === 'object') {
      const o = t as Record<string, unknown>
      const history = Array.isArray(o.history) ? o.history : []
      const index = typeof o.index === 'number' && Number.isInteger(o.index) ? o.index : history.length - 1
      id = history[Math.min(Math.max(index, 0), history.length - 1)]
    }
    if (typeof id !== 'string' || n.tabs.includes(id)) return
    n.tabs.push(id)
    if (i === a) activeId = id
  })
  n.active = n.tabs.length ? Math.max(0, activeId ? n.tabs.indexOf(activeId) : Math.min(a, n.tabs.length - 1)) : -1
  return n
}
