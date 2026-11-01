import { finalStat, STATS } from '@onepiece/core'
import type { Entity } from './entity'
import { masteredHaki, normalizeGameBlock, type GameBlock } from './gameBlock'
import { WIKI_LINK } from './links'
import { displayValue } from './props'
import { TYPE_DEFS } from './types'

// Export d'une fiche en Markdown (M9, D-M16, D-M30) : titre, alias, propriétés lisibles, bloc de jeu résumé,
// étiquettes et texte. Les `[[liens]]` deviennent le nom affiché ; les médias, une mention entre crochets.

/** Texte Markdown d'une fiche, pour la copier ou l'enregistrer en .md. */
export function entityMarkdown(e: Entity, titleOf: (id: string) => string, assetName: (id: string) => string = () => ''): string {
  const out: string[] = [`# ${e.title}`, '']
  const def = TYPE_DEFS[e.type]
  out.push(`*${def.label}${e.aliases.length ? ` · aussi appelé : ${e.aliases.join(', ')}` : ''}*`, '')

  const rows = def.fields.flatMap(f => {
    if (f.field.kind === 'gameBlock') return []
    const v = f.field.kind === 'asset' ? (typeof e.props[f.key] === 'string' ? assetName(String(e.props[f.key])) : '') : displayValue(f, e.props[f.key], titleOf)
    return v ? [`| ${f.label} | ${cell(v)} |`] : []
  })
  if (rows.length) out.push('| Propriété | Valeur |', '|---|---|', ...rows, '')

  const block = e.type === 'personnage' ? normalizeGameBlock(e.props.jeu) : undefined
  if (block) out.push(...gameBlockMarkdown(block), '')

  if (e.tags.length) out.push(`Étiquettes : ${e.tags.join(', ')}`, '')
  const body = bodyMarkdown(e.bodyMd, assetName).trim()
  if (body) out.push(body, '')
  return `${out.join('\n').trimEnd()}\n`
}

/** Valeur dans une cellule de tableau : sur une ligne, sans casser les colonnes. */
const cell = (v: string) => v.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ; ')

/** Texte de la fiche : liens par leur nom affiché, médias (`asset:`) en mention. */
export function bodyMarkdown(md: string, assetName: (id: string) => string = () => ''): string {
  return md
    .replace(WIKI_LINK, (_all, _id: string, label: string) => label)
    .replace(/!\[([^\]]*)\]\(asset:([^)\s]+)\)/g, (_all, alt: string, id: string) => `*[image : ${alt || assetName(id) || 'sans nom'}]*`)
    .replace(/\[([^\]]*)\]\(asset:([^)\s]+)\)/g, (_all, text: string, id: string) => `${text || assetName(id) || 'fichier'} *(fichier joint)*`)
}

function gameBlockMarkdown(b: GameBlock): string[] {
  const out = ['## Bloc de jeu', '']
  const stats = STATS.map(([k, label]) => {
    const v = finalStat(b, k)
    return `${label} ${v}${v !== b.stats[k].valeur ? ` (base ${b.stats[k].valeur})` : ''}`
  })
  out.push(`**Caractéristiques** : ${stats.join(' · ')}`)
  const r = b.ressources
  const res = [`Vitalité ${r.vitalite.cur}/${r.vitalite.max}`, `Endurance ${r.endurance.cur}/${r.endurance.max}`, ...b.ressourcesPerso.map(p => `${p.nom || 'Ressource'} ${p.cur}/${p.max}`)]
  out.push(`**Ressources** : ${res.join(' · ')}`)
  if (b.categorie) out.push(`**Catégorie** : ${b.categorie}`)
  const haki = masteredHaki(b)
  if (haki.length) out.push(`**Haki maîtrisé** : ${haki.join(', ')}`)
  if (b.reve.trim()) out.push(`**Rêve** : ${b.reve.trim()}`)
  if (b.competences.length) {
    out.push('', '**Techniques**', '')
    for (const s of b.competences) out.push(`- **${s.titre || 'Sans titre'}**${s.cout != null ? ` (${s.cout} Endurance)` : ''}${s.description.trim() ? ` : ${s.description.trim().replace(/\s*\n\s*/g, ' ')}` : ''}`)
  }
  if (b.equipement.trim()) out.push('', `**Équipement** : ${b.equipement.trim()}`)
  if (b.inventaire.trim()) out.push('', `**Inventaire** : ${b.inventaire.trim()}`)
  return out
}

/** Nom de fichier sûr (« Île du Sud.md ») : caractères interdits par Windows et ChromeOS retirés. */
export function markdownFileName(title: string): string {
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+/, '')
  return `${base.slice(0, 120) || 'fiche'}.md`
}
