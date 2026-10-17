// Pages enfants (`parentId`) : « Déplacer vers… » ne doit jamais créer de boucle.

export interface TreeNode {
  id: string
  parentId: string | null
}

/** Identifiants de toutes les pages sous `id` (enfants, petits-enfants…). */
export function descendants(id: string, nodes: readonly TreeNode[]): Set<string> {
  const children = new Map<string, string[]>()
  for (const n of nodes) {
    if (!n.parentId) continue
    const list = children.get(n.parentId) ?? []
    list.push(n.id)
    children.set(n.parentId, list)
  }
  const out = new Set<string>()
  const stack = [...(children.get(id) ?? [])]
  while (stack.length) {
    const c = stack.pop()!
    if (out.has(c)) continue
    out.add(c)
    stack.push(...(children.get(c) ?? []))
  }
  return out
}

/** Une page peut aller sous `target` (ou à la racine, `null`) si ce n'est ni elle-même ni une de ses sous-pages. */
export function canMoveUnder(id: string, target: string | null, nodes: readonly TreeNode[]): boolean {
  if (target === null) return true
  return target !== id && !descendants(id, nodes).has(target)
}

export interface TreeItem<T> {
  node: T
  children: TreeItem<T>[]
}

/**
 * Arbre pour l'affichage (vue « Arbre » des listes) : à partir des racines, les enfants donnés par `childrenOf`.
 * Une fiche déjà placée plus haut dans la branche n'est pas répétée (protection contre les boucles).
 */
export function buildTree<T extends { id: string }>(roots: readonly T[], childrenOf: (id: string) => readonly T[]): TreeItem<T>[] {
  const walk = (n: T, seen: Set<string>): TreeItem<T> => {
    const next = new Set(seen).add(n.id)
    return { node: n, children: childrenOf(n.id).filter(c => !next.has(c.id)).map(c => walk(c, next)) }
  }
  return roots.map(r => walk(r, new Set()))
}
