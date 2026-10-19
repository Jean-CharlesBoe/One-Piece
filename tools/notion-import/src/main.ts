import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { emptyBackupData, makeManifest, packBackup, readBackup } from '../../../apps/mj/src/lib/backup/format'
import { convert, type ImportConfig, type Synonym } from './convert'
import { readExportZip } from './notion'
import { renderReport } from './report'

// npm run notion:import -- <export.zip> <sortie.opmj>   (IMPORT_NOTION §2)
// Écrit la sauvegarde .opmj (à restaurer dans l'app) et rapport-import.md à côté.

const here = dirname(fileURLToPath(import.meta.url))

/** Synonymes communs (versionnés) + configuration privée du monde (`input/import.json`, ignorée par git). */
export function loadConfig(): ImportConfig {
  const common = JSON.parse(readFileSync(join(here, '..', 'synonymes.json'), 'utf8')) as Synonym[]
  const privatePath = join(here, '..', 'input', 'import.json')
  const priv = existsSync(privatePath) ? (JSON.parse(readFileSync(privatePath, 'utf8')) as Partial<ImportConfig>) : {}
  return { synonymes: [...(priv.synonymes ?? []), ...common], parents: priv.parents ?? {} }
}

export function main(args: string[]): void {
  const [input, output] = args
  if (!input || !output) {
    console.error('Usage : npm run notion:import -- <export.zip> <sortie.opmj>')
    process.exitCode = 1
    return
  }
  const exp = readExportZip(new Uint8Array(readFileSync(input)))
  const { entities, assets, media, report } = convert(exp, loadConfig())
  const data = { ...emptyBackupData(), entities, assets }
  const manifest = makeManifest(data, { lastChangeAt: new Date().toISOString(), appVersion: 'import-notion', device: 'Import Notion' })
  const bytes = packBackup(manifest, data, media)
  // Relu comme le fera l'app avant de l'écrire : un fichier refusé ne sort pas.
  const check = readBackup(bytes)
  writeFileSync(output, bytes)
  const reportPath = join(dirname(output), 'rapport-import.md')
  writeFileSync(reportPath, renderReport(entities, assets.length, report, input))
  console.log(
    `${check.data.entities.length} fiches, ${assets.length} médias → ${output} (${(bytes.length / 1e6).toFixed(1)} Mo)\n` +
      `Rapport : ${reportPath} (${Object.values(report.warnings).flat().length} avertissements)`,
  )
}
