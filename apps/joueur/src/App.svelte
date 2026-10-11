<script lang="ts">
  import { App as CapApp } from '@capacitor/app'
  import { Capacitor } from '@capacitor/core'
  import { handleBack, showInfo } from '@onepiece/core'
  import { onMount } from 'svelte'
  import CharacterScreen from './lib/screens/CharacterScreen.svelte'
  import Home from './lib/screens/Home.svelte'
  import { getRepository, META_SHOW_INFO } from './lib/storage/repository'

  let openId = $state<string | null>(null)

  onMount(() => {
    // Réglages enregistrés (table meta) : « i » affichés sauf si le joueur les a masqués.
    getRepository()
      .then(r => r.getMeta(META_SHOW_INFO))
      .then(v => showInfo.set(v !== 'false'))
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
