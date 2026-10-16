import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

// Version lue dans le package.json de l'app (les scripts racine ne fournissent pas npm_package_version).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/** Fichiers du dossier public/ (manifeste, icônes), chemins relatifs avec des « / ». */
function publicFiles(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? publicFiles(p, base) : [relative(base, p).replaceAll('\\', '/')]
  })
}

/**
 * Hors ligne (D-M18) : au build, écrit `sw.js`, le service worker qui met en cache tous les fichiers de l'app
 * (code, styles, moteur SQLite, manifeste, icônes). Le nom du cache change à chaque build : la nouvelle version
 * remplace l'ancienne au lancement suivant. Rien en développement.
 */
function serviceWorker(): Plugin {
  return {
    name: 'onepiece-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = ['./', ...Object.keys(bundle), ...publicFiles(fileURLToPath(new URL('./public', import.meta.url)))]
        .filter(f => f !== 'sw.js')
        .map(f => (f === './' ? f : `./${f}`))
      const hash = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 10)
      const source = readFileSync(new URL('./sw.template.js', import.meta.url), 'utf8')
        .replace('__CACHE__', JSON.stringify(`onepiece-mj-${version}-${hash}`))
        .replace('__FILES__', JSON.stringify(files, null, 2))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [svelte(), serviceWorker()],
  // Chemins relatifs : l'app est publiée dans un sous-dossier (GitHub Pages : /One-Piece/).
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
