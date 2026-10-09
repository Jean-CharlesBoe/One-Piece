import { newId } from '../model/ids'
import { isSkillOrigin } from '../model/identity'
import type { CustomResource, Resource } from '../model/resources'
import type { Skill } from '../model/skills'
import { emptyStats, isStatKey, STATS, type Stats, type TempBonus } from '../model/stats'
import { clampInt, LIMITS } from './numbers'

// Briques de normalisation des données lues (base, import, sauvegarde) : champs manquants complétés,
// valeurs ramenées dans leurs bornes, champs inconnus ignorés. Ne lèvent jamais d'exception.
// `w` reçoit en français la description de ce qui a été corrigé ; `who` préfixe ces messages.

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '')
const num = (v: unknown, def: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : def)
const date = (v: unknown): string | null => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null)
const id = (v: unknown): string => (typeof v === 'string' && v ? v : newId())

/** Lecteurs prudents de valeurs inconnues, pour les `normalize*` propres à chaque app. */
export const read = { obj, arr, str, num, date, id }

/** Coût en Endurance. Vide ou invalide = pas de coût. */
export function normalizeCost(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return clampInt(value, 0, LIMITS.costMax)
}

export function normalizeStats(raw: unknown, w: string[], who = '', defaultValue = 0): Stats {
  const r = obj(raw)
  const s = emptyStats(defaultValue)
  for (const [k, label] of STATS) {
    const st = obj(r[k])
    const v = clampInt(num(st.valeur, defaultValue), 0, LIMITS.statMax)
    if (st.valeur !== undefined && st.valeur !== v) w.push(`${who}${label} « ${String(st.valeur)} » ramenée à ${v}`)
    s[k] = { valeur: v, avantages: clampInt(num(st.avantages, 0), LIMITS.avantagesMin, LIMITS.avantagesMax) }
  }
  return s
}

/** Les bonus sur une carac inconnue ou de valeur nulle sont écartés. */
export function normalizeTempBonuses(raw: unknown): TempBonus[] {
  return arr(raw)
    .map(obj)
    .filter(b => isStatKey(b.carac))
    .map(b => ({
      id: id(b.id),
      carac: b.carac as TempBonus['carac'],
      valeur: clampInt(num(b.valeur, 0), LIMITS.bonusMin, LIMITS.bonusMax),
      origine: str(b.origine, LIMITS.textShort),
    }))
    .filter(b => b.valeur !== 0)
}

/** `def` : valeur de la ressource si elle est absente (ex. Rêve à 10 / 10). */
export function normalizeResource(raw: unknown, label: string, w: string[], who = '', def?: Resource): Resource {
  if (raw === undefined && def) return { ...def }
  const r = obj(raw)
  const max = clampInt(num(r.max, 0), 0, LIMITS.resourceMax)
  const cur0 = clampInt(num(r.cur, max), 0, LIMITS.resourceMax)
  const cur = Math.min(cur0, max)
  if (cur !== cur0) w.push(`${who}${label} actuelle (${cur0}) ramenée au maximum (${max})`)
  return { cur, max, regeneration: str(r.regeneration, LIMITS.textShort) }
}

export function normalizeSkills(raw: unknown): Skill[] {
  return arr(raw)
    .map(obj)
    .map(s => ({
      id: id(s.id),
      titre: str(s.titre, LIMITS.textShort),
      cout: normalizeCost(s.cout),
      origine: isSkillOrigin(s.origine) ? s.origine : '',
      description: str(s.description, LIMITS.textLong),
    }))
}

export function normalizeCustomResources(raw: unknown, w: string[], who = ''): CustomResource[] {
  return arr(raw)
    .map(obj)
    .map(r => {
      const nom = str(r.nom, LIMITS.textShort)
      return { ...normalizeResource(r, nom || 'Ressource', w, who), id: id(r.id), nom, regle: str(r.regle, LIMITS.textMedium) }
    })
}
