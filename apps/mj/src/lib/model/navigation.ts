// Onglets et historique (D-M14, cahier §3) : chaque onglet a son historique Précédent / Suivant.
// Un clic remplace la fiche de l'onglet actif ; « nouvel onglet » en ajoute un. 8 onglets au plus (le plus
// ancien inactif se ferme), 50 pas d'historique par onglet. Fonctions pures : elles modifient l'état reçu.

export const MAX_TABS = 8
export const MAX_HISTORY = 50

export interface Tab {
  history: string[]
  index: number
}

export interface Navigation {
  tabs: Tab[]
  active: number
}

export const emptyNavigation = (): Navigation => ({ tabs: [], active: -1 })

/** Fiche affichée par un onglet (ou par l'onglet actif). */
export function currentId(n: Navigation, i = n.active): string | null {
  const t = n.tabs[i]
  return t ? (t.history[t.index] ?? null) : null
}

export function openIn(n: Navigation, id: string, newTab: boolean): void {
  const tab = n.tabs[n.active]
  if (!tab || newTab) {
    n.tabs.push({ history: [id], index: 0 })
    n.active = n.tabs.length - 1
    if (n.tabs.length > MAX_TABS) {
      // Le plus ancien onglet qui n'est pas celui qu'on vient d'ouvrir.
      n.tabs.splice(0, 1)
      n.active--
    }
    return
  }
  if (tab.history[tab.index] === id) return
  tab.history = [...tab.history.slice(0, tab.index + 1), id].slice(-MAX_HISTORY)
  tab.index = tab.history.length - 1
}

export const canBack = (n: Navigation) => (n.tabs[n.active]?.index ?? 0) > 0
export const canForward = (n: Navigation) => {
  const t = n.tabs[n.active]
  return !!t && t.index < t.history.length - 1
}

export function back(n: Navigation): void {
  const t = n.tabs[n.active]
  if (t && t.index > 0) t.index--
}

export function forward(n: Navigation): void {
  const t = n.tabs[n.active]
  if (t && t.index < t.history.length - 1) t.index++
}

export function closeTab(n: Navigation, i: number): void {
  if (i < 0 || i >= n.tabs.length) return
  n.tabs.splice(i, 1)
  if (!n.tabs.length) n.active = -1
  else if (i < n.active || n.active >= n.tabs.length) n.active = Math.max(0, n.active - 1)
}

/**
 * Retire une fiche qui n'existe plus (supprimée) ou n'est plus à afficher : elle disparaît des historiques ;
 * un onglet qui n'a plus rien à montrer se ferme.
 */
export function forget(n: Navigation, keep: (id: string) => boolean): void {
  for (let i = n.tabs.length - 1; i >= 0; i--) {
    const t = n.tabs[i]
    const before = t.history[t.index]
    // Sans la fiche retirée, et sans deux fois la même fiche à la suite.
    t.history = t.history.filter(keep).filter((id, j, h) => j === 0 || h[j - 1] !== id)
    const pos = t.history.lastIndexOf(before)
    t.index = pos >= 0 ? pos : Math.min(t.index, t.history.length - 1)
    if (!t.history.length) closeTab(n, i)
  }
}

/** Relit un état sauvegardé (meta « onglets ») ; tout ce qui est illisible est ignoré. */
export function normalizeNavigation(raw: unknown): Navigation {
  const n = emptyNavigation()
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const tabs = Array.isArray(r.tabs) ? r.tabs : []
  for (const t of tabs.slice(-MAX_TABS)) {
    const o = t && typeof t === 'object' ? (t as Record<string, unknown>) : {}
    const history = (Array.isArray(o.history) ? o.history : []).filter((x): x is string => typeof x === 'string').slice(-MAX_HISTORY)
    if (!history.length) continue
    const index = typeof o.index === 'number' && Number.isInteger(o.index) ? Math.min(Math.max(o.index, 0), history.length - 1) : history.length - 1
    n.tabs.push({ history, index })
  }
  const a = typeof r.active === 'number' && Number.isInteger(r.active) ? r.active : 0
  n.active = n.tabs.length ? Math.min(Math.max(a, 0), n.tabs.length - 1) : -1
  return n
}
