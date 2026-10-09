import { summarize, type CharacterSummary } from '../model/character'
import { normalizeCharacter } from '../model/normalize'
import type { CharacterRepository } from './repository'

// Stockage de développement uniquement (navigateur du PC) : sur téléphone, c'est SQLite (D-T3).
const KEY = 'vivrecard:dev:characters'

function readAll(): Record<string, unknown> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, unknown>): void {
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function createWebRepository(): CharacterRepository {
  return {
    async list(): Promise<CharacterSummary[]> {
      return Object.values(readAll())
        .map(raw => summarize(normalizeCharacter(raw).character))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    async get(id) {
      const raw = readAll()[id]
      return raw ? normalizeCharacter(raw).character : null
    },
    async save(c) {
      const all = readAll()
      all[c.id] = JSON.parse(JSON.stringify(c))
      writeAll(all)
    },
    async remove(id) {
      const all = readAll()
      delete all[id]
      writeAll(all)
    },
    async getMeta(key) {
      return localStorage.getItem(`vivrecard:dev:meta:${key}`)
    },
    async setMeta(key, value) {
      localStorage.setItem(`vivrecard:dev:meta:${key}`, value)
    },
  }
}
