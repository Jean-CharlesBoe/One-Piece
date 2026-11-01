import { LIMITS, newId, read, STATS } from '@onepiece/core'
import type { RawRow } from '../backup/format'
import type { Entity } from './entity'
import { normalizeGameBlock, type GameBlock } from './gameBlock'
import { wikiLink, wikiLinks } from './links'

// Journal de session (M8b, cahier §5.2, MODELE_DONNEES §2) : entrées horodatées, saisies par le MJ ou ajoutées
// automatiquement quand le bloc de jeu ou l'état d'un PNJ change pendant la session (D-M15).

export const JOURNAL_KINDS = [
  ['evenement', 'Événement'],
  ['combat', 'Combat'],
  ['decouverte', 'Découverte'],
  ['xp', 'XP'],
  ['note', 'Note MJ'],
  ['haki', 'Haki'],
  ['auto', 'Auto'],
] as const
export type JournalKind = (typeof JOURNAL_KINDS)[number][0]
/** Types proposés à la saisie (Haki : M8c ; Auto : ajouté par l'app). */
export const INPUT_KINDS = JOURNAL_KINDS.filter(([k]) => k !== 'haki' && k !== 'auto')

/** Un changement relevé automatiquement : « Fushia : Vitalité 45 → 33 ». */
export interface AutoChange {
  entityId: string
  /** Clé stable du champ (« vitalite », « perso:<id> », « bonus », « etat »). */
  field: string
  label: string
  from: string
  to: string
}

export interface JournalEntry {
  id: string
  sessionId: string
  /** Horodatage réel (ISO). */
  at: string
  kind: JournalKind
  textMd: string
  auto: AutoChange | null
  haki: unknown
  createdAt: string
  updatedAt: string
}

export const kindLabel = (k: JournalKind) => JOURNAL_KINDS.find(([x]) => x === k)?.[1] ?? k
const isKind = (v: unknown): v is JournalKind => JOURNAL_KINDS.some(([k]) => k === v)

export function createEntry(sessionId: string, kind: JournalKind, textMd: string, at = new Date().toISOString()): JournalEntry {
  return { id: newId(), sessionId, at, kind, textMd, auto: null, haki: null, createdAt: at, updatedAt: at }
}

function parseJson(v: unknown): unknown {
  if (typeof v !== 'string') return v ?? null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

function normalizeAuto(raw: unknown): AutoChange | null {
  const r = read.obj(parseJson(raw))
  const s = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : String(r[k] ?? ''))
  return typeof r.entityId === 'string' && r.entityId ? { entityId: r.entityId, field: s('field'), label: s('label'), from: s('from'), to: s('to') } : null
}

/** Ligne `journal_entries` (SQL ou modèle) → entrée ; `null` si inutilisable. */
export function normalizeEntry(raw: unknown): JournalEntry | null {
  const r = read.obj(raw)
  const pick = (a: string, b: string) => r[a] ?? r[b]
  const id = typeof r.id === 'string' ? r.id : ''
  const sessionId = String(pick('sessionId', 'session_id') ?? '')
  const at = read.date(r.at)
  if (!id || !sessionId || !at) return null
  return {
    id,
    sessionId,
    at,
    kind: isKind(r.kind) ? r.kind : 'evenement',
    textMd: read.str(pick('textMd', 'text_md'), LIMITS.textLong),
    auto: normalizeAuto(r.auto),
    haki: parseJson(r.haki),
    createdAt: read.date(pick('createdAt', 'created_at')) ?? at,
    updatedAt: read.date(pick('updatedAt', 'updated_at')) ?? at,
  }
}

export function entryRow(e: JournalEntry): RawRow {
  return {
    id: e.id,
    session_id: e.sessionId,
    at: e.at,
    kind: e.kind,
    text_md: e.textMd,
    auto: e.auto ? JSON.stringify(e.auto) : null,
    haki: e.haki == null ? null : JSON.stringify(e.haki),
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  }
}

/** Fiches citées par une entrée : liens `[[ ]]` et fiche d'une entrée automatique (chronologie, M8c). */
export function entryMentions(e: Pick<JournalEntry, 'textMd' | 'auto'>): string[] {
  const ids = new Set(wikiLinks(e.textMd).map(l => l.id).filter(id => id !== '?'))
  if (e.auto) ids.add(e.auto.entityId)
  return [...ids]
}

/** Heure lisible (« 21:04 »). */
export const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// --- Entrées automatiques -----------------------------------------------------------------------------------

const RESOURCES = [
  ['vitalite', 'Vitalité'],
  ['endurance', 'Endurance'],
  ['reve', 'Rêve'],
  ['ambition', 'Ambition'],
  ['transfert', 'Transfert'],
] as const

const statLabel = (k: string) => STATS.find(([key]) => key === k)?.[1] ?? k
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
const bonusText = (b: GameBlock['bonusTemporaires']) =>
  b.length ? b.map(x => `${statLabel(x.carac)} ${signed(x.valeur)}${x.origine ? ` (${x.origine})` : ''}`).join(', ') : 'aucun'

/**
 * Changements à noter entre deux versions d'un PNJ : ressources actuelles (Vitalité, Endurance, Rêve, Ambition,
 * Transfert, ressources supplémentaires), bonus temporaires, état (« mort »). Les maximums et les caracs (réglages
 * de préparation) ne sont pas notés.
 */
export function gameChanges(before: Entity, after: Entity): AutoChange[] {
  const out: AutoChange[] = []
  const add = (field: string, label: string, from: string, to: string) => {
    if (from !== to) out.push({ entityId: after.id, field, label, from, to })
  }
  const etatA = String(before.props.etat ?? '')
  const etatB = String(after.props.etat ?? '')
  if (etatA !== etatB) add('etat', 'État', etatA || '—', etatB || '—')
  const a = normalizeGameBlock(before.props.jeu)
  const b = normalizeGameBlock(after.props.jeu)
  if (!a || !b) return out
  for (const [k, label] of RESOURCES) add(k, label, String(a.ressources[k].cur), String(b.ressources[k].cur))
  for (const r of b.ressourcesPerso) {
    const old = a.ressourcesPerso.find(x => x.id === r.id)
    if (old) add(`perso:${r.id}`, r.nom || 'Ressource', String(old.cur), String(r.cur))
  }
  add('bonus', 'Bonus temporaires', bonusText(a.bonusTemporaires), bonusText(b.bonusTemporaires))
  return out
}

/** Texte d'une entrée automatique : « [[id|Fushia]] : Vitalité 45 → 33 » ; « … : mort ». */
export function autoText(c: AutoChange, title: string): string {
  const who = wikiLink(c.entityId, title)
  if (c.field === 'etat' && c.to === 'Mort') return `${who} : mort`
  return `${who} : ${c.label} ${c.from} → ${c.to}`
}

/** Délai de regroupement : plusieurs changements de la même valeur en moins de 10 s = une seule entrée (D-M15). */
export const GROUP_MS = 10_000

/**
 * Applique un changement au journal : prolonge l'entrée automatique récente du même champ (même PNJ, moins de
 * 10 s, « de » d'origine gardé), ou en crée une. Une valeur revenue à son point de départ supprime l'entrée.
 * Renvoie l'entrée à enregistrer et celle à supprimer.
 */
export function mergeAuto(
  entries: readonly JournalEntry[],
  c: AutoChange,
  title: string,
  sessionId: string,
  now = new Date(),
): { save: JournalEntry | null; remove: string | null } {
  const recent = [...entries]
    .reverse()
    .find(e => e.kind === 'auto' && e.auto?.entityId === c.entityId && e.auto.field === c.field && now.getTime() - Date.parse(e.updatedAt) < GROUP_MS)
  if (recent?.auto) {
    const merged: AutoChange = { ...c, from: recent.auto.from }
    if (merged.from === merged.to) return { save: null, remove: recent.id }
    return { save: { ...recent, auto: merged, textMd: autoText(merged, title), updatedAt: now.toISOString() }, remove: null }
  }
  const e = createEntry(sessionId, 'auto', autoText(c, title), now.toISOString())
  e.auto = c
  return { save: e, remove: null }
}

/** Liste des entrées pour pré-remplir le résumé d'une session terminée. */
export function summaryFromJournal(entries: readonly JournalEntry[], withAuto = false): string {
  return entries
    .filter(e => withAuto || e.kind !== 'auto')
    .map(e => `- ${timeLabel(e.at)} — ${e.kind === 'evenement' || e.kind === 'auto' ? '' : `${kindLabel(e.kind)} : `}${e.textMd.replace(/\n+/g, ' ')}`)
    .join('\n')
}
