import { catalog } from './catalog.svelte'
import { toCatalogEntry, type Entity } from './model/entity'
import { getRepository } from './storage/repository'

// Fiche ouverte et sa sauvegarde automatique (cahier MJ §4.3) : chaque modification programme un
// enregistrement 400 ms plus tard ; changer de fiche, quitter l'édition ou passer l'app en arrière-plan
// enregistre tout de suite.

export type SaveState = 'enregistre' | 'en-attente' | 'erreur'

class Opened {
  entity = $state<Entity | null>(null)
  editing = $state(false)
  save = $state<SaveState>('enregistre')
  error = $state('')
  #timer: ReturnType<typeof setTimeout> | null = null
  /** Numéro de la dernière modification : une modification faite pendant l'enregistrement reste à enregistrer. */
  #version = 0

  async open(id: string): Promise<void> {
    await this.flush()
    const e = await (await getRepository()).getEntity(id)
    this.entity = e
    this.editing = false
  }

  async close(): Promise<void> {
    await this.flush()
    this.entity = null
    this.editing = false
  }

  async setEditing(on: boolean): Promise<void> {
    if (!on) await this.flush()
    this.editing = on && !!this.entity
  }

  /** À appeler après chaque modification de la fiche ouverte. */
  changed(): void {
    if (!this.entity) return
    this.save = 'en-attente'
    this.#version++
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => void this.flush(), 400)
  }

  /** Modifie la fiche et l'enregistre tout de suite (épingler, archiver…). */
  async apply(mutate: (e: Entity) => void): Promise<void> {
    if (!this.entity) return
    mutate(this.entity)
    this.save = 'en-attente'
    this.#version++
    await this.flush()
  }

  async flush(): Promise<void> {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = null
    const e = this.entity
    if (!e || this.save !== 'en-attente') return
    // Un titre vide le temps de la saisie n'est pas enregistré : on attend le prochain changement.
    if (!e.title.trim()) return
    e.updatedAt = new Date().toISOString()
    const version = this.#version
    const snap = $state.snapshot(e) as Entity
    snap.title = snap.title.trim()
    try {
      await (await getRepository()).saveEntity(snap)
      catalog.upsert(toCatalogEntry(snap))
      if (this.#version === version) this.save = 'enregistre'
      this.error = ''
    } catch (err) {
      this.save = 'erreur'
      this.error = 'Fiche non enregistrée : ' + (err instanceof Error ? err.message : String(err))
    }
  }
}

export const opened = new Opened()
