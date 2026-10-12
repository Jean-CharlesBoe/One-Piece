import { watchTheme } from '@onepiece/core'
import '@onepiece/core/theme.css'
import { mount } from 'svelte'
import App from './App.svelte'

// Thème clair / sombre avant le premier affichage (automatique tant que le réglage n'est pas chargé).
watchTheme()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
