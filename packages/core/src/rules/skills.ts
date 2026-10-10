import { newId } from '../model/ids'
import { SKILL_ORIGINS, type SkillOrigin } from '../model/identity'
import type { Skill } from '../model/skills'
import { normalizeCost } from './normalize'
import { LIMITS } from './numbers'

// Compétences (cahier joueur §4.7). Pas de dépense automatique d'Endurance (D-J12) :
// le coût est affiché, le joueur ajuste lui-même le losange.

interface HasSkills {
  competences: Skill[]
}

/** Filtre de la liste : une origine, ou toutes. */
export type SkillFilter = 'toutes' | Exclude<SkillOrigin, ''>

export function addSkill(owner: HasSkills, titre = '', origine: SkillOrigin = ''): Skill {
  const skill: Skill = { id: newId(), titre: titre.slice(0, LIMITS.textShort), cout: null, origine, description: '' }
  owner.competences.push(skill)
  return skill
}

export function updateSkill(skill: Skill, patch: Partial<Omit<Skill, 'id'>>): Skill {
  if (patch.titre !== undefined) skill.titre = patch.titre.slice(0, LIMITS.textShort)
  if (patch.description !== undefined) skill.description = patch.description.slice(0, LIMITS.textLong)
  if ('cout' in patch) skill.cout = normalizeCost(patch.cout)
  if (patch.origine !== undefined) skill.origine = patch.origine
  return skill
}

export function filterSkills(list: Skill[], filter: SkillFilter): Skill[] {
  return filter === 'toutes' ? list : list.filter(s => s.origine === filter)
}

/** Origines présentes dans la liste, dans l'ordre de SKILL_ORIGINS : ce sont les filtres proposés. */
export function usedOrigins(list: Skill[]): Exclude<SkillOrigin, ''>[] {
  const used = new Set<SkillOrigin>(list.map(s => s.origine))
  return SKILL_ORIGINS.map(([k]) => k).filter(k => used.has(k))
}
