import { defineConfig } from 'vitest/config'

// Les scripts racine n'appellent jamais `npm run` imbriqué : un vieux npm présent sur le PATH
// (ex. C:\node_modules) ignorerait --workspaces et relancerait le script racine en boucle.
export default defineConfig({
  test: { projects: ['packages/*', 'apps/joueur', 'apps/mj'] },
})
