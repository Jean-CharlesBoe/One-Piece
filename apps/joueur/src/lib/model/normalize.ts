import {
  clampInt,
  createResource,
  isClasse,
  isRace,
  isTribu,
  LIMITS,
  normalizeCustomResources,
  normalizeFruit,
  normalizeResource,
  normalizeSkills,
  normalizeStats,
  normalizeTempBonuses,
  read,
} from '@onepiece/core'
import {
  createCharacter,
  createCompagnon,
  SCHEMA_VERSION,
  type Character,
  type Compagnon,
  type Fiche,
} from './character'

const { obj, arr, str, num, date, id } = read

/**
 * Remet d'aplomb un personnage lu en base ou importé : champs manquants complétés, valeurs hors bornes
 * ramenées dans les bornes, champs inconnus ignorés. Ne lève jamais d'exception.
 * Les `warnings` décrivent en français ce qui a été corrigé.
 *
 * Évolution du format : quand SCHEMA_VERSION augmente, ajouter ici la conversion depuis l'ancienne version.
 */
export function normalizeCharacter(raw: unknown): { character: Character; warnings: string[] } {
  const w: string[] = []
  const r = obj(raw)
  const c = createCharacter('')
  if (!raw || typeof raw !== 'object') w.push('données illisibles, personnage vierge créé')

  const version = typeof r.schemaVersion === 'number' ? r.schemaVersion : 0
  if (version > SCHEMA_VERSION) w.push(`fiche créée par une version plus récente de l'app (format ${version})`)

  c.id = id(r.id)
  c.createdAt = date(r.createdAt) ?? c.createdAt
  c.updatedAt = date(r.updatedAt) ?? c.updatedAt
  if (isRace(r.race)) c.race = r.race
  else if (r.race) w.push(`race inconnue « ${String(r.race)} » ignorée`)
  readFiche(c, r, w, '')
  c.compagnons = arr(r.compagnons).map(x => compagnon(x, w))
  c.schemaVersion = SCHEMA_VERSION
  return { character: c, warnings: w }
}

/** Compagnon : même fiche qu'un PJ (D-J17), race libre. Un ancien champ `type` est ignoré. */
function compagnon(raw: unknown, w: string[]): Compagnon {
  const r = obj(raw)
  const cp = createCompagnon('')
  cp.id = id(r.id)
  cp.race = str(r.race, LIMITS.textShort).trim()
  readFiche(cp, r, w, `compagnon « ${str(r.nom, LIMITS.textShort) || 'sans nom'} » : `)
  return cp
}

/** Champs communs à un PJ et à un compagnon. */
function readFiche(f: Fiche, r: Record<string, unknown>, w: string[], who: string): void {
  f.nom = str(r.nom, LIMITS.textShort)
  f.titre = str(r.titre, LIMITS.textShort)
  f.age = str(r.age, 40)
  if (isTribu(r.tribu)) f.tribu = r.tribu
  f.classes = [...new Set(arr(r.classes).filter(isClasse))]
  f.reve = str(r.reve, LIMITS.textMedium)
  f.prime = typeof r.prime === 'number' && Number.isFinite(r.prime) ? clampInt(r.prime, 0, LIMITS.primeMax) : null
  f.stats = normalizeStats(r.stats, w, who)
  f.bonusTemporaires = normalizeTempBonuses(r.bonusTemporaires)
  const res = obj(r.ressources)
  f.ressources = {
    vitalite: normalizeResource(res.vitalite, 'Vitalité', w, who),
    endurance: normalizeResource(res.endurance, 'Endurance', w, who),
    reve: normalizeResource(res.reve, 'Rêve', w, who, createResource(10)),
    ambition: normalizeResource(res.ambition, 'Ambition', w, who, createResource(10)),
  }
  f.ressourcesPerso = normalizeCustomResources(r.ressourcesPerso, w, who)
  f.fruit = normalizeFruit(r.fruit)
  f.xp = clampInt(num(r.xp, 0), 0, LIMITS.xpMax)
  f.equipement = str(r.equipement, LIMITS.textLong)
  f.inventaire = str(r.inventaire, LIMITS.textLong)
  f.competences = normalizeSkills(r.competences)
}
