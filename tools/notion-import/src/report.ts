import type { Entity } from '../../../apps/mj/src/lib/model/entity'
import { REASON_LABEL, similarPairs } from '../../../apps/mj/src/lib/model/similar'
import { ENTITY_TYPES, TYPE_DEFS } from '../../../apps/mj/src/lib/model/types'
import type { Report } from './convert'

// Rapport d'import (IMPORT_NOTION §5) : à lire avant de restaurer le fichier dans l'app.

export function renderReport(entities: Entity[], assetCount: number, report: Report, source: string): string {
  const out: string[] = ['# Rapport d’import Notion', '', `Source : \`${source}\` · ${new Date().toLocaleString('fr-FR')}`, '']

  out.push('## Fiches créées', '', '| Type | Nombre |', '|---|---|')
  for (const t of ENTITY_TYPES) {
    const n = entities.filter(e => e.type === t).length
    if (n) out.push(`| ${TYPE_DEFS[t].plural} | ${n} |`)
  }
  out.push(`| **Total** | **${entities.length}** |`, '', `Médias (images, PDF) : ${assetCount}.`, '')

  section(out, 'Synonymes appliqués', report.synonymsApplied)
  section(out, 'Factions créées depuis les étiquettes', report.factionsCreated)
  for (const [topic, list] of Object.entries(report.warnings)) section(out, topic, list)
  section(out, 'Pages non importées', report.skipped)

  const pairs = similarPairs(entities.filter(e => e.type !== 'document'))
  section(
    out,
    'Doublons probables',
    pairs.map(p => `${TYPE_DEFS[p.a.type].label} « ${p.a.title} » / ${TYPE_DEFS[p.b.type].label} « ${p.b.title} » — ${REASON_LABEL[p.reason]} (${p.names.join(' / ')})`),
    'À trancher dans l’app (vue « Doublons probables »), ou dans `input/import.json` (synonymes) avant de relancer.',
  )
  return out.join('\n')
}

function section(out: string[], title: string, items: string[], intro?: string) {
  out.push(`## ${title} (${items.length})`, '')
  if (intro) out.push(intro, '')
  if (!items.length) out.push('Aucun.', '')
  else out.push(...items.map(i => `- ${i}`), '')
}
