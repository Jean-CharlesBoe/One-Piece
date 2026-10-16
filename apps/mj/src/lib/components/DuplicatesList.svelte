<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { REASON_LABEL, similarPairs, type SimilarPair } from '../model/similar'
  import type { CatalogEntry } from '../model/entity'
  import { TYPE_DEFS } from '../model/types'
  import { getRepository } from '../storage/repository'

  // Vue « Doublons probables » (cahier §4.7) : paires de fiches aux noms proches, à traiter une par une.
  // Calculée à l'ouverture de la vue (et après chaque traitement), pas à chaque enregistrement.
  let { onOpen, onMerge }: { onOpen: (id: string) => void; onMerge: (a: string, b: string) => void } = $props()

  let pairs = $state<SimilarPair<CatalogEntry>[] | null>(null)
  let error = $state('')

  async function compute() {
    try {
      const ignored = new Set(await (await getRepository()).listNotDuplicates())
      pairs = similarPairs(catalog.active, ignored)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  // Recalcul seulement quand un nom change (fusion, archivage, renommage, alias) : pas à chaque sauvegarde
  // automatique d'une fiche ouverte à côté.
  const names = $derived(catalog.active.map(e => `${e.id}:${e.type}:${e.title}:${e.aliases.join('|')}`).join('\n'))
  $effect(() => {
    void names
    void compute()
  })

  async function different(p: SimilarPair<CatalogEntry>) {
    await (await getRepository()).markNotDuplicate(p.a.id, p.b.id)
    await compute()
  }
</script>

<section class="dups" aria-labelledby="dups-titre">
  <header>
    <h2 id="dups-titre">Doublons probables {#if pairs}<span class="count">{pairs.length}</span>{/if}</h2>
  </header>
  {#if error}<p class="error">{error}</p>{/if}
  {#if pairs === null}
    <p class="empty">Recherche des noms proches…</p>
  {:else if !pairs.length}
    <p class="empty">Aucun doublon probable. Un nom de référence par chose !</p>
  {:else}
    <ul>
      {#each pairs as p (`${p.a.id}|${p.b.id}`)}
        <li class="pair">
          <div class="names">
            <a href="#{p.a.id}" onclick={e => (e.preventDefault(), onOpen(p.a.id))}>{TYPE_DEFS[p.a.type].icon} {p.a.title}</a>
            <span class="muted">et</span>
            <a href="#{p.b.id}" onclick={e => (e.preventDefault(), onOpen(p.b.id))}>{TYPE_DEFS[p.b.type].icon} {p.b.title}</a>
          </div>
          <p class="why">{REASON_LABEL[p.reason]} : « {p.names[0]} » / « {p.names[1]} »</p>
          <div class="row">
            <button onclick={() => onMerge(p.a.id, p.b.id)}>Fusionner…</button>
            <button onclick={() => different(p)} title="Ne plus proposer cette paire">Deux choses différentes</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .dups {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  header {
    min-height: 61px;
    padding: 12px;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
  }
  h2 {
    margin: 0;
    font-size: 1.05rem;
  }
  .count {
    color: var(--muted);
    font-weight: normal;
    font-size: 0.9rem;
  }
  ul {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 6px;
    display: grid;
    align-content: start;
    gap: 8px;
  }
  .pair {
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
  }
  .names {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: baseline;
  }
  .names a {
    color: var(--accent);
    font-weight: 600;
  }
  .why {
    margin: 4px 0 8px;
    color: var(--muted);
    font-size: 0.85rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .row button {
    min-height: 40px;
    padding: 0 10px;
    font-size: 0.9rem;
  }
  .muted {
    color: var(--muted);
  }
  .empty,
  .error {
    margin: 16px 12px;
    color: var(--muted);
  }
  .error {
    color: var(--danger);
  }
</style>
