import {
  back,
  canBack,
  canForward,
  closeTab,
  currentId,
  emptyNavigation,
  forget,
  forward,
  normalizeNavigation,
  openIn,
  type Navigation,
} from './model/navigation'
import { getRepository } from './storage/repository'

// Onglets de fiches (D-M14) : état réactif autour de model/navigation.ts, gardé en base (meta « onglets »)
// pour rouvrir les mêmes fiches au démarrage.

const KEY = 'onglets'

class Tabs {
  nav = $state<Navigation>(emptyNavigation())
  current = $derived(currentId(this.nav))
  canBack = $derived(canBack(this.nav))
  canForward = $derived(canForward(this.nav))
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

  open(id: string, newTab = false): void {
    openIn(this.nav, id, newTab)
    this.#save()
  }

  back(): void {
    back(this.nav)
    this.#save()
  }

  forward(): void {
    forward(this.nav)
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
