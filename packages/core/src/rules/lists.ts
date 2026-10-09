/** Déplace l'élément d'index `from` de `delta` positions (−1 = monter). Renvoie false hors limites. */
export function moveItem<T>(list: T[], from: number, delta: number): boolean {
  const to = from + delta
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return false
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item)
  return true
}

export function removeById<T extends { id: string }>(list: T[], id: string): void {
  const i = list.findIndex(x => x.id === id)
  if (i >= 0) list.splice(i, 1)
}
