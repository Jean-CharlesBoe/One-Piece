<script lang="ts">
  import { App as CapApp } from '@capacitor/app'
  import { Capacitor } from '@capacitor/core'
  import { handleBack } from '@onepiece/core'
  import { onMount } from 'svelte'
  import CharacterScreen from './lib/screens/CharacterScreen.svelte'
  import Home from './lib/screens/Home.svelte'

  let openId = $state<string | null>(null)

  onMount(() => {
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
