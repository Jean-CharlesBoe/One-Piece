import {
  closeTab,
  currentId,
  cycleTab,
  emptyNavigation,
  forget,
  moveTab,
  normalizeNavigation,
  openIn,
  type Navigation,
} from './model/navigation'
import { getRepository } from './storage/repository'

// Onglets de fiches (D-M14, D-M21) : état réactif autour de model/navigation.ts, gardé en base (meta « onglets »)
// pour rouvrir les mêmes fiches au démarrage.

const KEY = 'onglets'

class Tabs {
  nav = $state<Navigation>(emptyNavigation())
  current = $derived(currentId(this.nav))
  #timer: ReturnType<typeof setTimeout> | null = null

  async load(exists: (id: string) => boolean): Promise<void> {
    try {
      const n = normalizeNavigation(JSON.parse((await (await getRepository()).getMeta(KEY)) ?? 'null'))
      forget(n, exists)
      this.nav = n
    } catch {
      this.nav = emptyNavigation()
    }
  }

  /** Ouvre la fiche dans un nouvel onglet, ou revient sur son onglet si elle est déjà ouverte. */
  open(id: string): void {
    openIn(this.nav, id)
    this.#save()
  }

  activate(i: number): void {
    if (i >= 0 && i < this.nav.tabs.length) this.nav.active = i
    this.#save()
  }

  close(i: number): void {
    closeTab(this.nav, i)
    this.#save()
  }

  move(from: number, to: number): void {
    moveTab(this.nav, from, to)
    this.#save()
  }

  cycle(delta: number): void {
    cycleTab(this.nav, delta)
    this.#save()
  }

  /** Fiche supprimée définitivement (ou fusionnée et absorbée) : retirée des onglets. */
  forget(id: string): void {
    forget(this.nav, x => x !== id)
    this.#save()
  }

  #save(): void {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => {
      getRepository()
        .then(r => r.setMeta(KEY, JSON.stringify($state.snapshot(this.nav))))
        .catch(e => console.error('[onepiece-mj] onglets', e))
    }, 500)
  }
}

export const tabs = new Tabs()
