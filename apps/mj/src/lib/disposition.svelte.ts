import { getRepository } from './storage/repository'

// Disposition de l'écran (D-M27) : largeur de la barre latérale (réglable à la souris ou au clavier), barre
// latérale et panneau Liens repliés ou ouverts. Réglage de l'appareil (meta « disposition »), hors sauvegarde
// comme les onglets (D-M19).

const KEY = 'disposition'
export const SIDEBAR_MIN = 180
export const SIDEBAR_MAX = 420
export const SIDEBAR_DEFAULT = 230

export const clampWidth = (w: number) => Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w)))

class Disposition {
  sidebarWidth = $state(SIDEBAR_DEFAULT)
  sidebarOpen = $state(true)
  linksOpen = $state(true)
  #timer: ReturnType<typeof setTimeout> | null = null

  async load(): Promise<void> {
    try {
      const raw = JSON.parse((await (await getRepository()).getMeta(KEY)) ?? 'null') as Record<string, unknown> | null
      if (!raw || typeof raw !== 'object') return
      if (typeof raw.sidebarWidth === 'number' && Number.isFinite(raw.sidebarWidth)) this.sidebarWidth = clampWidth(raw.sidebarWidth)
      if (typeof raw.sidebarOpen === 'boolean') this.sidebarOpen = raw.sidebarOpen
      if (typeof raw.linksOpen === 'boolean') this.linksOpen = raw.linksOpen
    } catch {
      // Réglage illisible : valeurs par défaut.
    }
  }

  setWidth(w: number): void {
    this.sidebarWidth = clampWidth(w)
    this.#save()
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen
    this.#save()
  }

  toggleLinks(): void {
    this.linksOpen = !this.linksOpen
    this.#save()
  }

  #save(): void {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => {
      const value = { sidebarWidth: this.sidebarWidth, sidebarOpen: this.sidebarOpen, linksOpen: this.linksOpen }
      getRepository()
        .then(r => r.setMeta(KEY, JSON.stringify(value)))
        .catch(e => console.error('[onepiece-mj] disposition', e))
    }, 300)
  }
}

export const disposition = new Disposition()
