// Lance l'import Notion (src/main.ts) : Vite charge le TypeScript et le code partagé de l'appli MJ.
import { fileURLToPath } from 'node:url'
import { runnerImport } from 'vite'

const { module } = await runnerImport(fileURLToPath(new URL('./src/main.ts', import.meta.url)))
module.main(process.argv.slice(2))
