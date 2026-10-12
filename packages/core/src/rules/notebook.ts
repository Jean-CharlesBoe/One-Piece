import { newId } from '../model/ids'
import type { LoreSection, SessionEntry } from '../model/notebook'
import { LIMITS } from './numbers'

// Carnet (Lore et Histoire), repris de Sans Nom v0.5 (D9 de Sans Nom, D-J22).

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Date du jour au format AAAA-MM-JJ (heure locale du téléphone). */
export function todayIso(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** Vraie date du calendrier au format AAAA-MM-JJ (refuse 2026-02-30). */
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

export function addLoreSection(owner: { lore: LoreSection[] }, titre = ''): LoreSection {
  const s: LoreSection = { id: newId(), titre: titre.slice(0, LIMITS.textShort), texte: '' }
  owner.lore.push(s)
  return s
}

export function updateLoreSection(s: LoreSection, patch: Partial<Omit<LoreSection, 'id'>>): LoreSection {
  if (patch.titre !== undefined) s.titre = patch.titre.slice(0, LIMITS.textShort)
  if (patch.texte !== undefined) s.texte = patch.texte.slice(0, LIMITS.textChapter)
  return s
}

export function addSession(owner: { histoire: SessionEntry[] }, date = todayIso()): SessionEntry {
  const e: SessionEntry = { id: newId(), date: isIsoDate(date) ? date : todayIso(), titre: '', texte: '' }
  owner.histoire.push(e)
  return e
}

/** Une date invalide est ignorée (la date précédente est conservée). */
export function updateSession(e: SessionEntry, patch: Partial<Omit<SessionEntry, 'id'>>): SessionEntry {
  if (patch.date !== undefined && isIsoDate(patch.date)) e.date = patch.date
  if (patch.titre !== undefined) e.titre = patch.titre.slice(0, LIMITS.textShort)
  if (patch.texte !== undefined) e.texte = patch.texte.slice(0, LIMITS.textChapter)
  return e
}

/** Séances de la plus récente à la plus ancienne ; à date égale, la dernière créée d'abord. */
export function sessionsByDate(list: SessionEntry[]): SessionEntry[] {
  return list
    .map((e, i) => ({ e, i }))
    .sort((a, b) => b.e.date.localeCompare(a.e.date) || b.i - a.i)
    .map(x => x.e)
}

/** « 12 oct. 2026 » à partir de « 2026-10-12 ». */
export function formatSessionDate(iso: string): string {
  if (!isIsoDate(iso)) return iso
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
