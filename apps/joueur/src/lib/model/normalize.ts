import {
  createResource,
  isClasse,
  isFruitType,
  isPalier,
  isRace,
  isTribu,
  LIMITS,
  clampInt,
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
  type CustomResource,
  type Fruit,
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
  c.nom = str(r.nom, LIMITS.textShort)
  c.titre = str(r.titre, LIMITS.textShort)
  c.age = str(r.age, 40)
  if (isRace(r.race)) c.race = r.race
  else if (r.race) w.push(`race inconnue « ${String(r.race)} » ignorée`)
  if (isTribu(r.tribu)) c.tribu = r.tribu
  c.classes = [...new Set(arr(r.classes).filter(isClasse))]
  if (isPalier(r.palierDe)) c.palierDe = r.palierDe
  c.reve = str(r.reve, LIMITS.textMedium)
  c.stats = normalizeStats(r.stats, w)
  c.bonusTemporaires = normalizeTempBonuses(r.bonusTemporaires)
  const res = obj(r.ressources)
  c.ressources = {
    vitalite: normalizeResource(res.vitalite, 'Vitalité', w),
    endurance: normalizeResource(res.endurance, 'Endurance', w),
    reve: normalizeResource(res.reve, 'Rêve', w, '', createResource(10)),
    ambition: normalizeResource(res.ambition, 'Ambition', w, '', createResource(10)),
  }
  c.ressourcesPerso = arr(r.ressourcesPerso).map(x => customResource(x, w))
  c.fruit = fruit(r.fruit)
  c.xp = clampInt(num(r.xp, 0), 0, LIMITS.xpMax)
  c.equipement = str(r.equipement, LIMITS.textLong)
  c.inventaire = str(r.inventaire, LIMITS.textLong)
  c.competences = normalizeSkills(r.competences)
  c.compagnons = arr(r.compagnons).map(x => compagnon(x, w))
  c.schemaVersion = SCHEMA_VERSION
  return { character: c, warnings: w }
}

function customResource(raw: unknown, w: string[]): CustomResource {
  const r = obj(raw)
  const nom = str(r.nom, LIMITS.textShort)
  return { ...normalizeResource(r, nom || 'Ressource', w), id: id(r.id), nom, regle: str(r.regle, LIMITS.textMedium) }
}

function fruit(raw: unknown): Fruit | null {
  if (!raw || typeof raw !== 'object') return null
  const r = obj(raw)
  return {
    nom: str(r.nom, LIMITS.textShort),
    type: isFruitType(r.type) ? r.type : '',
    description: str(r.description, LIMITS.textLong),
    eveil: str(r.eveil, LIMITS.textLong),
  }
}

function compagnon(raw: unknown, w: string[]): Compagnon {
  const r = obj(raw)
  const cp = createCompagnon(str(r.nom, LIMITS.textShort))
  const who = `compagnon « ${cp.nom || 'sans nom'} » : `
  cp.id = id(r.id)
  cp.type = str(r.type, LIMITS.textShort)
  cp.race = str(r.race, LIMITS.textShort)
  cp.stats = normalizeStats(r.stats, w, who)
  cp.bonusTemporaires = normalizeTempBonuses(r.bonusTemporaires)
  const res = obj(r.ressources)
  cp.ressources = {
    vitalite: normalizeResource(res.vitalite, 'Vitalité', w, who),
    endurance: normalizeResource(res.endurance, 'Endurance', w, who),
  }
  cp.equipement = str(r.equipement, LIMITS.textLong)
  cp.inventaire = str(r.inventaire, LIMITS.textLong)
  cp.competences = normalizeSkills(r.competences)
  return cp
}
