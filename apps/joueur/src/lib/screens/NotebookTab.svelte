<script lang="ts" module>
  // Sous-onglet affiché en dernier : conservé tant que l'app est ouverte.
  let remembered: 'lore' | 'histoire' = 'lore'
</script>

<script lang="ts">
  import { addLoreSection, addSession, moveItem, removeById, updateLoreSection, updateSession } from '@onepiece/core'
  import NoteList from '../components/NoteList.svelte'
  import type { Character } from '../model/character'

  // Onglet Carnet (D-J22, repris de Sans Nom v0.5) : Lore (sections titrées) et Histoire (une entrée par séance).
  // Écrire et ajouter : à tout moment ; supprimer et réordonner : mode édition.
  let { character, editing }: { character: Character; editing: boolean } = $props()

  let sub = $state(remembered)
  $effect(() => {
    remembered = sub
  })
  const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`
</script>

<div class="seg" role="tablist" aria-label="Carnet">
  <button role="tab" aria-selected={sub === 'lore'} class:on={sub === 'lore'} onclick={() => (sub = 'lore')}>Lore</button>
  <button role="tab" aria-selected={sub === 'histoire'} class:on={sub === 'histoire'} onclick={() => (sub = 'histoire')}>
    Histoire
  </button>
</div>

{#if sub === 'lore'}
  <NoteList
    items={character.lore}
    {editing}
    unitLabel={n => plural(n, 'section', 'sections')}
    addLabel="+ Section"
    emptyText="Aucune section. Ajoute par exemple « Origines », « Famille », « Équipage »…"
    onAdd={() => addLoreSection(character)}
    onUpdate={(s, patch) => updateLoreSection(s, patch)}
    onRemove={id => removeById(character.lore, id)}
    onMove={(i, d) => moveItem(character.lore, i, d)}
  />
{:else}
  <NoteList
    items={character.histoire}
    dated
    {editing}
    unitLabel={n => plural(n, 'séance', 'séances')}
    addLabel="+ Séance"
    emptyText="Aucune séance notée. « + Séance » crée une entrée datée du jour."
    onAdd={() => addSession(character)}
    onUpdate={(e, patch) => updateSession(e, patch)}
    onRemove={id => removeById(character.histoire, id)}
  />
{/if}

<style>
  .seg {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 14px;
  }
  .seg button {
    border: none;
    border-radius: 0;
    background: var(--surface);
    color: var(--muted);
  }
  .seg button.on {
    background: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
  }
</style>
