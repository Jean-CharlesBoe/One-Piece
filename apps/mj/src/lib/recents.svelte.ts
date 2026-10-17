import { getRepository } from './storage/repository'

// Fiches récentes (cahier §4.5) : les 20 dernières ouvertes, la plus récente d'abord, gardées en base (meta).

const KEY = 'recents'
const MAX = 20

class Recents {
  ids = $state<string[]>([])
  #timer: ReturnType<typeof setTimeout> | null = null

  async load(): Promise<void> {
    try {
      const v = JSON.parse((await (await getRepository()).getMeta(KEY)) ?? '[]')
      this.ids = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX) : []
    } catch {
      this.ids = []
    }
  }

  push(id: string): void {
    this.ids = [id, ...this.ids.filter(x => x !== id)].slice(0, MAX)
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => {
      getRepository()
        .then(r => r.setMeta(KEY, JSON.stringify(this.ids)))
        .catch(e => console.error('[onepiece-mj] récents', e))
    }, 1000)
  }
}

export const recents = new Recents()
