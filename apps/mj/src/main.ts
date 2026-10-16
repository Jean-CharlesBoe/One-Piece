import { watchTheme } from '@onepiece/core'
import '@onepiece/core/theme.css'
import { mount } from 'svelte'
import App from './App.svelte'
import { pwa } from './lib/pwa.svelte'

// Thème clair / sombre avant le premier affichage (automatique tant que le réglage n'est pas chargé).
watchTheme()
// Hors ligne, installation, stockage persistant (D-M18).
pwa.start()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
