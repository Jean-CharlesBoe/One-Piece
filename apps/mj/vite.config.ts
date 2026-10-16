import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createReadStream, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// Version lue dans le package.json de l'app (les scripts racine ne fournissent pas npm_package_version).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/**
 * Repli web de développement (src/lib/storage/webDb.ts) : sert le moteur SQLite de sql.js à l'adresse
 * `/assets/sql-wasm.wasm`. Serveur de dev seulement : le fichier n'entre jamais dans le build ni dans l'APK,
 * où la base est le SQLite natif (D-T3).
 */
function sqlWasmDev(): Plugin {
  // Dans le navigateur, sql.js charge sql-wasm-browser.js, qui demande sql-wasm-browser.wasm : on sert le
  // fichier demandé, pris dans le dossier dist de sql.js.
  const dist = dirname(createRequire(import.meta.url).resolve('sql.js/dist/sql-wasm.js'))
  return {
    name: 'onepiece-sql-wasm-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /^\/assets\/(sql-wasm[\w-]*\.wasm)$/.exec(req.url ?? '')
        if (!m) return next()
        res.setHeader('Content-Type', 'application/wasm')
        createReadStream(join(dist, m[1])).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [svelte(), sqlWasmDev()],
  // Chemins relatifs : l'app est servie depuis les assets de l'APK
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
