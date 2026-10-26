import { LIMITS, newId, read } from '@onepiece/core'
import type { RawRow } from '../backup/format'

// Sessions de jeu (M8a, cahier §5.1, MODELE_DONNEES §2) : une seule campagne (D-M13), sessions numérotées à la
// suite. Préparation et résumé en Markdown (liens [[ ]]). Fiches épinglées et instantané des blocs de jeu :
// pour l'écran « Session en cours » (M8b).

export const SESSION_STATUSES = [
  ['prevue', 'Prévue'],
  ['en_cours', 'En cours'],
  ['terminee', 'Terminée'],
] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number][0]

export interface Session {
  id: string
  campaignId: string
  number: number
  title: string
  /** Date réelle de la partie (AAAA-MM-JJ), ou null. */
  playedOn: string | null
  scenarioId: string | null
  status: SessionStatus
  prepMd: string
  summaryMd: string
  /** Fiches de la session, dans l'ordre (M8b). */
  pinnedIds: string[]
  /** État des blocs de jeu au démarrage, JSON (M8b, D-M13) ; gardé tel quel. */
  snapshot: string | null
  createdAt: string
  updatedAt: string
}

/** Préfixe des onglets de session (les onglets portent sinon l'identifiant d'une fiche). */
export const SESSION_TAB = 'session:'
export const sessionTab = (id: string) => `${SESSION_TAB}${id}`
export const sessionIdOfTab = (tab: string) => (tab.startsWith(SESSION_TAB) ? tab.slice(SESSION_TAB.length) : null)

export const statusLabel = (s: SessionStatus) => SESSION_STATUSES.find(([k]) => k === s)?.[1] ?? s

/** « Session 4 — L'île du Sud » (titre facultatif). */
export const sessionLabel = (s: Pick<Session, 'number' | 'title'>) => `Session ${s.number}${s.title.trim() ? ` — ${s.title.trim()}` : ''}`

/** Numéro de la prochaine session. */
export const nextNumber = (list: readonly Pick<Session, 'number'>[]) => list.reduce((m, s) => Math.max(m, s.number), 0) + 1

export function createSession(campaignId: string, number: number): Session {
  const now = new Date().toISOString()
  return {
    id: newId(),
    campaignId,
    number,
    title: '',
    playedOn: null,
    scenarioId: null,
    status: 'prevue',
    prepMd: '',
    summaryMd: '',
    pinnedIds: [],
    snapshot: null,
    createdAt: now,
    updatedAt: now,
  }
}

const isStatus = (v: unknown): v is SessionStatus => SESSION_STATUSES.some(([k]) => k === v)
const isoDay = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

/** Ligne `sessions` (SQL ou modèle) → session ; `null` si inutilisable. */
export function normalizeSession(raw: unknown): Session | null {
  const r = read.obj(raw)
  const pick = (a: string, b: string) => r[a] ?? r[b]
  const id = typeof r.id === 'string' ? r.id : ''
  const campaignId = String(pick('campaignId', 'campaign_id') ?? '')
  if (!id || !campaignId) return null
  let pinned: unknown = pick('pinnedIds', 'pinned_ids')
  if (typeof pinned === 'string') {
    try {
      pinned = JSON.parse(pinned)
    } catch {
      pinned = []
    }
  }
  const snap = r.snapshot
  const number = Number(r.number)
  const status = r.status
  return {
    id,
    campaignId,
    number: Number.isInteger(number) && number > 0 ? number : 1,
    title: read.str(r.title, LIMITS.textShort),
    playedOn: isoDay(pick('playedOn', 'played_on')),
    scenarioId: (pick('scenarioId', 'scenario_id') as string | null) || null,
    status: isStatus(status) ? status : 'prevue',
    prepMd: read.str(pick('prepMd', 'prep_md'), LIMITS.textLong),
    summaryMd: read.str(pick('summaryMd', 'summary_md'), LIMITS.textLong),
    pinnedIds: read.arr(pinned).filter((x): x is string => typeof x === 'string'),
    snapshot: typeof snap === 'string' ? snap : snap && typeof snap === 'object' ? JSON.stringify(snap) : null,
    createdAt: read.date(pick('createdAt', 'created_at')) ?? new Date(0).toISOString(),
    updatedAt: read.date(pick('updatedAt', 'updated_at')) ?? new Date(0).toISOString(),
  }
}

export function sessionRow(s: Session): RawRow {
  return {
    id: s.id,
    campaign_id: s.campaignId,
    number: s.number,
    title: s.title,
    played_on: s.playedOn,
    scenario_id: s.scenarioId,
    status: s.status,
    prep_md: s.prepMd,
    summary_md: s.summaryMd,
    pinned_ids: JSON.stringify(s.pinnedIds),
    snapshot: s.snapshot,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }
}

/** Date lisible (« 22 février 2025 »). */
export function dayLabel(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// --- Reprise des notes de session importées de Notion (D-M22, D-M26) ---------------------------------------

export interface ImportedNote {
  id: string
  title: string
  bodyMd: string
}

/** « Session 1 (22/02/25) — Note de session » → numéro, date ISO, intitulé. */
export function parseSessionNoteTitle(title: string): { number: number; playedOn: string | null; label: string } | null {
  const m = /^Session\s+(\d+)\s*(?:\((\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\))?\s*[—–-]\s*(.+)$/i.exec(title.trim())
  if (!m) return null
  const year = m[4] ? (m[4].length === 2 ? `20${m[4]}` : m[4]) : null
  const playedOn = year ? `${year}-${m[3].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null
  return { number: Number(m[1]), playedOn: isoDay(playedOn), label: m[5].trim() }
}

export interface NotePlan {
  /** Sessions à créer ou compléter, par numéro. */
  sessions: { number: number; playedOn: string | null; summaryMd: string; prepMd: string; done: boolean }[]
  /** Notes reprises (à archiver). */
  noteIds: string[]
}

/**
 * Plan de reprise : une « Note de session » de la session N → résumé de N (Terminée) ; une autre note rattachée à
 * la session N (« Idée pour la suite ») → préparation de N+1. Plusieurs textes au même endroit : mis à la suite,
 * sous leur intitulé.
 */
export function planImportedNotes(notes: readonly ImportedNote[]): NotePlan {
  const byNumber = new Map<number, NotePlan['sessions'][number]>()
  const get = (n: number) => {
    let s = byNumber.get(n)
    if (!s) byNumber.set(n, (s = { number: n, playedOn: null, summaryMd: '', prepMd: '', done: false }))
    return s
  }
  const add = (text: string, label: string, more: string) => (text ? `${text}\n\n## ${label}\n\n${more}` : more)
  const noteIds: string[] = []
  for (const note of [...notes].sort((a, b) => a.title.localeCompare(b.title, 'fr', { numeric: true }))) {
    const t = parseSessionNoteTitle(note.title)
    if (!t) continue
    noteIds.push(note.id)
    if (/note de session/i.test(t.label)) {
      const s = get(t.number)
      s.summaryMd = add(s.summaryMd, t.label, note.bodyMd.trim())
      s.playedOn ??= t.playedOn
      s.done = true
    } else {
      const s = get(t.number + 1)
      s.prepMd = add(s.prepMd, t.label, s.prepMd ? note.bodyMd.trim() : `## ${t.label}\n\n${note.bodyMd.trim()}`)
    }
  }
  return { sessions: [...byNumber.values()].sort((a, b) => a.number - b.number), noteIds }
}
