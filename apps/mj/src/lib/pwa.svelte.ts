// Appli web installable (D-M18) : service worker (hors ligne), installation, stockage persistant.

/** Événement `beforeinstallprompt` de Chrome (non typé par TypeScript). */
interface InstallPrompt extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

class Pwa {
  /** Chrome propose l'installation (l'app n'est pas encore installée sur cet appareil). */
  canInstall = $state(false)
  /** Ouverte comme app installée (fenêtre à elle). */
  installed = $state(matchMedia('(display-mode: standalone)').matches)
  /** Stockage protégé contre le nettoyage automatique du navigateur ; null = inconnu. */
  persisted = $state<boolean | null>(null)
  /** Place occupée par l'app, en octets. */
  usage = $state<number | null>(null)
  #prompt: InstallPrompt | null = null

  start(): void {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(e => console.error('[onepiece-mj] service worker', e))
    }
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      this.#prompt = e as InstallPrompt
      this.canInstall = true
    })
    window.addEventListener('appinstalled', () => {
      this.canInstall = false
      this.installed = true
    })
    void this.requestPersistence()
  }

  async install(): Promise<void> {
    if (!this.#prompt) return
    await this.#prompt.prompt()
    await this.#prompt.userChoice
    this.#prompt = null
    this.canInstall = false
  }

  /** Demande au navigateur de ne jamais libérer de lui-même la place de l'app (base, médias). */
  async requestPersistence(): Promise<void> {
    const s = navigator.storage
    if (!s?.persist) return
    try {
      this.persisted = (await s.persisted()) || (await s.persist())
      this.usage = (await s.estimate()).usage ?? null
    } catch (e) {
      console.error('[onepiece-mj] stockage persistant', e)
    }
  }
}

export const pwa = new Pwa()
