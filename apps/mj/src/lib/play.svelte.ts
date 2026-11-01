import { catalog } from './catalog.svelte'
import { toCatalogEntry, type Entity } from './model/entity'
import { createEntry, gameChanges, mergeAuto, summaryFromJournal, type JournalEntry, type JournalKind } from './model/journal'
import type { Session } from './model/session'
import { parseSnapshot, restoreItem, takeSnapshot } from './model/snapshot'
import { sessions } from './sessions.svelte'
import { getRepository } from './storage/repository'

// Session en cours (M8b, cahier §5.2, D-M26, D-M27) : une seule à la fois. Démarrer prend l'instantané des blocs
// de jeu ; le journal de la session est tenu ici (saisie du MJ et entrées automatiques) ; terminer pré-remplit
// le résumé. La remise à l'état de début reste possible ensuite, depuis la session.

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

class Play {
  /** La session en cours, ou null. */
  running = $derived(sessions.list.find(s => s.status === 'en_cours') ?? null)
  /** Journal de la session en cours, dans l'ordre chronologique. */
  entries = $state.raw<JournalEntry[]>([])
  #loadedFor: string | null = null

  /** Recharge le journal quand la session en cours change (lancement, démarrage, fin). */
  async sync(): Promise<void> {
    const id = this.running?.id ?? null
    if (id === this.#loadedFor) return
    this.#loadedFor = id
    this.entries = id ? await (await getRepository()).listJournal(id) : []
  }

  async start(s: Session): Promise<void> {
    if (this.running && this.running.id !== s.id) throw new Error(`${this.running.title || `Session ${this.running.number}`} est déjà en cours : termine-la d'abord.`)
    await sessions.save({
      ...s,
      status: 'en_cours',
      playedOn: s.playedOn ?? today(),
      snapshot: JSON.stringify(takeSnapshot(catalog.entries)),
    })
    await this.sync()
  }

  /** Termine la session ; un résumé vide est pré-rempli avec les entrées du journal. */
  async finish(): Promise<string | null> {
    const s = this.running
    if (!s) return null
    const summaryMd = s.summaryMd.trim() ? s.summaryMd : summaryFromJournal(this.entries)
    await sessions.save({ ...s, status: 'terminee', summaryMd })
    await this.sync()
    return s.id
  }

  async add(kind: JournalKind, textMd: string): Promise<void> {
    const s = this.running
    const text = textMd.trim()
    if (!s || !text) return
    const e = createEntry(s.id, kind, text)
    await (await getRepository()).saveJournalEntry(e)
    this.entries = [...this.entries, e]
  }

  async remove(id: string): Promise<void> {
    await (await getRepository()).deleteJournalEntry(id)
    this.entries = this.entries.filter(e => e.id !== id)
  }

  /** Fiche enregistrée pendant la session : changements du bloc de jeu ou de l'état → entrées automatiques. */
  async noteChanges(before: Entity, after: Entity): Promise<void> {
    const s = this.running
    if (!s || after.type !== 'personnage') return
    const r = await getRepository()
    for (const c of gameChanges(before, after)) {
      const { save, remove } = mergeAuto(this.entries, c, after.title, s.id)
      if (remove) {
        await r.deleteJournalEntry(remove)
        this.entries = this.entries.filter(e => e.id !== remove)
      }
      if (save) {
        await r.saveJournalEntry(save)
        this.entries = [...this.entries.filter(e => e.id !== save.id), save]
      }
    }
  }

  /** Remet des PNJ à l'état du début de la session (instantané). Renvoie les fiches modifiées. */
  async reset(s: Session, ids: readonly string[]): Promise<string[]> {
    const snap = parseSnapshot(s.snapshot)
    const r = await getRepository()
    const done: string[] = []
    for (const id of ids) {
      const item = snap[id]
      const e = item && (await r.getEntity(id))
      if (!e || !item) continue
      restoreItem(e.props, item)
      e.updatedAt = new Date().toISOString()
      await r.saveEntity(e)
      catalog.upsert(toCatalogEntry(e))
      done.push(id)
    }
    return done
  }
}

export const play = new Play()
