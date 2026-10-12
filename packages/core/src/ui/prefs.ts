import { writable } from 'svelte/store'

// Préférences d'affichage partagées par les composants (réglages de l'app, D-J7, D-J19).
// L'app charge et enregistre leur valeur (table meta) ; les composants se contentent de les lire.

/** Afficher les boutons « i » des mémos. */
export const showInfo = writable(true)

/** Thème : automatique (celui du téléphone), clair ou sombre. */
export const THEMES = [
  ['auto', 'Automatique'],
  ['clair', 'Clair'],
  ['sombre', 'Sombre'],
] as const
export type Theme = (typeof THEMES)[number][0]

export const theme = writable<Theme>('auto')

export const isTheme = (v: unknown): v is Theme => THEMES.some(([k]) => k === v)

/**
 * Applique le thème choisi : pose `data-theme="dark" | "light"` sur la page (voir theme.css) et, en mode
 * automatique, suit les changements de thème du téléphone. À appeler une fois au démarrage de l'app.
 */
export function watchTheme(root: HTMLElement = document.documentElement): () => void {
  const dark = matchMedia('(prefers-color-scheme: dark)')
  let current: Theme = 'auto'
  const apply = () => {
    root.dataset.theme = current === 'sombre' || (current === 'auto' && dark.matches) ? 'dark' : 'light'
  }
  const unsubscribe = theme.subscribe(t => {
    current = t
    apply()
  })
  dark.addEventListener('change', apply)
  return () => {
    unsubscribe()
    dark.removeEventListener('change', apply)
  }
}
