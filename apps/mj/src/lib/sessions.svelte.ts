import { createSession, nextNumber, type Session } from './model/session'
import { getRepository } from './storage/repository'

// Sessions de jeu en mémoire (M8a) : liste pour la barre latérale et les onglets, enregistrement immédiat.
// La vue d'une session garde sa propre copie et l'enregistre 400 ms après la dernière modification.

class Sessions {
  list = $state.raw<Session[]>([])
  byId = $derived(new Map(this.list.map(s => [s.id, s])))
  /** Sessions laissées en édition pour un autre onglet (comme les fiches, D-M25). */
  editing = $state<Set<string>>(new Set())

  async load(): Promise<void> {
    this.list = await (await getRepository()).listSessions()
  }

  /** Nouvelle session, numérotée à la suite. */
  async create(): Promise<Session> {
    const r = await getRepository()
    const s = createSession(await r.campaignId(), nextNumber(this.list))
    await this.save(s)
    return s
  }

  async save(s: Session): Promise<void> {
    const saved = { ...s, updatedAt: new Date().toISOString() }
    await (await getRepository()).saveSession(saved)
    this.list = [...this.list.filter(x => x.id !== s.id), saved].sort((a, b) => a.number - b.number)
  }

  async remove(id: string): Promise<void> {
    await (await getRepository()).deleteSession(id)
    this.list = this.list.filter(s => s.id !== id)
    this.setEditing(id, false)
  }

  setEditing(id: string, on: boolean): void {
    const next = new Set(this.editing)
    if (on) next.add(id)
    else next.delete(id)
    this.editing = next
  }
}

export const sessions = new Sessions()
