<script lang="ts">
  import { App as CapApp } from '@capacitor/app'
  import { Capacitor } from '@capacitor/core'
  import { handleBack, isTheme, showInfo, theme } from '@onepiece/core'
  import { onMount } from 'svelte'
  import CharacterScreen from './lib/screens/CharacterScreen.svelte'
  import Home from './lib/screens/Home.svelte'
  import { getRepository, META_SHOW_INFO, META_THEME } from './lib/storage/repository'

  let openId = $state<string | null>(null)

  onMount(() => {
    // Réglages enregistrés (table meta) : « i » affichés sauf si le joueur les a masqués ; thème automatique par défaut.
    getRepository()
      .then(async r => {
        showInfo.set((await r.getMeta(META_SHOW_INFO)) !== 'false')
        const t = await r.getMeta(META_THEME)
        theme.set(isTheme(t) ? t : 'auto')
      })
      .catch(e => console.error('[vivrecard] réglages illisibles', e))
    if (!Capacitor.isNativePlatform()) return
    // Bouton retour Android : fermer la fenêtre ouverte, sinon revenir à la liste, sinon quitter.
    const handle = CapApp.addListener('backButton', () => {
      if (handleBack()) return
      if (openId) openId = null
      else CapApp.exitApp()
    })
    return () => {
      handle.then(h => h.remove())
    }
  })
</script>

{#if openId}
  <CharacterScreen id={openId} onBack={() => (openId = null)} />
{:else}
  <Home onOpen={id => (openId = id)} />
{/if}
