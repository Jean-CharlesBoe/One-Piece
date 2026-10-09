import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// Version lue dans le package.json de l'app (les scripts racine ne fournissent pas npm_package_version).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  plugins: [svelte()],
  // Chemins relatifs : l'app est servie depuis les assets de l'APK
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
