<script lang="ts">
  import { LIMITS } from '@onepiece/core'

  // Liste de mots en pastilles (alias, étiquettes) : Entrée ou virgule ajoute, ✕ retire,
  // Retour arrière dans le champ vide retire la dernière.
  let {
    values,
    label,
    placeholder = '',
    onChange,
  }: { values: string[]; label: string; placeholder?: string; onChange: (values: string[]) => void } = $props()

  let draft = $state('')
  const id = $props.id()

  function add() {
    const v = draft.trim().slice(0, LIMITS.textShort)
    draft = ''
    if (v && !values.includes(v)) onChange([...values, v])
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }
</script>

<div class="chips">
  <label class="label" for={id}>{label}</label>
  <div class="box">
    {#each values as v (v)}
      <span class="chip">
        {v}
        <button type="button" aria-label="Retirer {v}" onclick={() => onChange(values.filter(x => x !== v))}>✕</button>
      </span>
    {/each}
    <input {id} bind:value={draft} {placeholder} onkeydown={onKey} onblur={add} />
  </div>
</div>

<style>
  .chips {
    display: grid;
    gap: 4px;
  }
  .box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 4px 6px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px 2px 10px;
    border-radius: 999px;
    background: var(--bg);
    font-size: 0.9rem;
  }
  .chip button {
    min-height: 36px;
    padding: 0 6px;
    border: none;
    background: none;
    color: var(--muted);
  }
  input {
    flex: 1;
    min-width: 120px;
    min-height: 30px;
    padding: 2px 4px;
    border: none;
    background: none;
  }
  input:focus-visible {
    outline: none;
  }
</style>
