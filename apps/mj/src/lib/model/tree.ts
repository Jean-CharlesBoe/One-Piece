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
