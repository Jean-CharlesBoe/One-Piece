// Pile des actions du bouton retour Android : la plus récente (ex. fenêtre ouverte) passe en premier.
const stack: (() => void)[] = []

/** Enregistre une action de retour. Renvoie la fonction qui la retire. */
export function onBack(fn: () => void): () => void {
  stack.push(fn)
  return () => {
    const i = stack.lastIndexOf(fn)
    if (i >= 0) stack.splice(i, 1)
  }
}

/** Exécute l'action de retour la plus récente. Renvoie false s'il n'y en a aucune. */
export function handleBack(): boolean {
  const fn = stack.at(-1)
  if (!fn) return false
  fn()
  return true
}
