<script lang="ts">
  import { HAKI_BEST, hakiLabel, hakiTally, type HakiTally } from '@onepiece/core'
  import { play } from '../play.svelte'
  import { getRepository } from '../storage/repository'

  // Récapitulatif des jets de Haki d'un PJ (cahier §5.2, D-M9) : lu dans le journal des sessions, ce n'est pas une
  // fiche technique du PJ (D-T0). Maîtrise atteinte = le MJ l'annonce au joueur, qui crée la compétence sur Vivre Card.
  let { id }: { id: string } = $props()

  let tally = $state.raw<HakiTally[]>([])
  $effect(() => {
    const pj = id
    void play.version
    getRepository()
      .then(r => r.entityJournal(pj))
      .then(refs => {
        if (pj !== id) return
        tally = hakiTally(
          refs.flatMap(r => (r.entry.haki?.pjId === pj ? [{ type: r.entry.haki.type, resultat: r.entry.haki.resultat, session: r.sessionNumber }] : [])),
        )
      })
      .catch(e => console.error('[onepiece-mj] haki', e))
  })

  const sessionsText = (n: number[]) => {
    const u = [...new Set(n)]
    return `session${u.length > 1 ? 's' : ''} ${u.join(', ')}`
  }
  const line = (t: HakiTally) =>
    t.objectif === 1
      ? t.meilleurs
        ? `résultat 1–${HAKI_BEST[t.type]} obtenu (${sessionsText(t.sessions)})`
        : `pas encore de résultat 1–${HAKI_BEST[t.type]} (${t.jets} jet${t.jets > 1 ? 's' : ''})`
      : `${t.meilleurs} meilleur${t.meilleurs > 1 ? 's' : ''} résultat${t.meilleurs > 1 ? 's' : ''} sur ${t.objectif} (${t.jets} jet${t.jets > 1 ? 's' : ''}${t.meilleurs ? `, ${sessionsText(t.sessions)}` : ''})`
</script>

{#if tally.length}
  <section class="haki" aria-labelledby="haki-{id}">
    <h3 class="label" id="haki-{id}">Haki · jets du MJ</h3>
    <ul>
      {#each tally as t (t.type)}
        <li>
          <b>{hakiLabel(t.type)}</b> : {line(t)}
          {#if t.maitrise}<span class="done">maîtrise atteinte : à annoncer au joueur</span>{/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .haki {
    margin: 12px 0;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  h3 {
    margin: 0 0 4px;
  }
  ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 2px;
  }
  .done {
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--up);
    border: 1px solid var(--up);
  }
</style>
