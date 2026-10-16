import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createReadStream, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { defineConfig, type Plugin } from 'vite'

// Version lue dans le package.json de l'app (les scripts racine ne fournissent pas npm_package_version).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/**
 * Repli web de développement (jeep-sqlite) : sert le moteur SQLite (sql.js) à l'adresse attendue par
 * jeep-sqlite, `/assets/sql-wasm.wasm`. Serveur de dev seulement : le fichier n'entre jamais dans le build
 * ni dans l'APK, où la base est le SQLite natif (D-T3).
 * Le wasm doit correspondre au code sql.js embarqué dans jeep-sqlite : jeep-sqlite 2.8.0 a été construit
 * avec sql.js 1.12 (34 imports wasm ; la 1.13 et suivantes en ont 38 et ne se chargent pas). D'où sql.js
 * fixé à 1.12.0 dans les devDependencies de l'app. À revoir à chaque mise à jour de jeep-sqlite.
 */
function sqlWasmDev(): Plugin {
  const require = createRequire(import.meta.url)
  const wasm = require.resolve('sql.js/dist/sql-wasm.wasm')
  return {
    name: 'onepiece-sql-wasm-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/assets/sql-wasm.wasm', (_req, res) => {
        res.setHeader('Content-Type', 'application/wasm')
        createReadStream(wasm).pipe(res)
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
