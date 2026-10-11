<script lang="ts">
  import {
    CLASSES,
    formatPrime,
    hasTribu,
    isAutreRace,
    mainClasse,
    parsePrime,
    RACES,
    setClasse,
    setPrime,
    setRace,
    TRIBUS,
    type Classe,
    type Tribu,
  } from '@onepiece/core'
  import type { Character, Compagnon } from '../model/character'

  // Bloc « Info » (cahier joueur §4.1, D-J13, D-J14), pour un PJ comme pour un compagnon (D-J17).
  // Mode jeu : surnom, race · tribu · classe · âge, rêve et prime (si saisie), en texte simple ;
  // mode édition : formulaire. `freeRace` (compagnon) ajoute « Autre race… » avec un champ libre.
  let {
    character,
    editing,
    freeRace = false,
  }: { character: Character | Compagnon; editing: boolean; freeRace?: boolean } = $props()
  const uid = $props.id()

  const AUTRE = '__autre__'
  /** « Autre race… » vient d'être choisi, avant toute saisie. */
  let autreChoisi = $state(false)
  const showAutre = $derived(freeRace && (autreChoisi || isAutreRace(character.race)))

  function pickRace(value: string) {
    if (value === AUTRE) {
      autreChoisi = true
      if (!isAutreRace(character.race)) setRace(character as { race: string }, '')
    } else {
      autreChoisi = false
      setRace(character as { race: string }, value)
    }
  }

  /** Montant sans le symbole, pour le champ de saisie (« 30 000 000 »). */
  const primeDigits = (n: number) => formatPrime(n).replace(/\s*฿$/, '')

  function commitPrime(input: HTMLInputElement) {
    const t = input.value.trim()
    if (t === '') setPrime(character, null)
    else {
      const n = parsePrime(t)
      if (n !== null) setPrime(character, n)
    }
    input.value = character.prime === null ? '' : primeDigits(character.prime)
  }

  const tribuLabel = $derived(hasTribu(character) ? (TRIBUS.find(([k]) => k === character.tribu)?.[1] ?? '') : '')
  const summary = $derived(
    [
      character.race,
      tribuLabel && character.tribu ? tribuLabel : '',
      character.classes.join(', '),
      character.age ? `${character.age} ans` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  )
</script>

<section aria-labelledby="{uid}-info">
<h2 class="label" id="{uid}-info">Info</h2>
{#if editing}
  <div class="form">
    <label class="wide">
      <span class="label">Nom</span>
      <input bind:value={character.nom} maxlength="120" autocomplete="off" />
    </label>
    <label class="wide">
      <span class="label">Surnom / titre</span>
      <input bind:value={character.titre} maxlength="120" placeholder="ex. le Démon rouge" autocomplete="off" />
    </label>
    <label>
      <span class="label">Race</span>
      <select value={showAutre ? AUTRE : character.race} onchange={e => pickRace(e.currentTarget.value)}>
        <option value="">—</option>
        {#each RACES as r (r)}
          <option value={r}>{r}</option>
        {/each}
        {#if freeRace}
          <option value={AUTRE}>Autre race…</option>
        {/if}
      </select>
    </label>
    <label>
      <span class="label">Âge</span>
      <input bind:value={character.age} maxlength="40" inputmode="numeric" autocomplete="off" />
    </label>
    {#if showAutre}
      <label class="wide">
        <span class="label">Nom de la race</span>
        <input
          value={isAutreRace(character.race) ? character.race : ''}
          onchange={e => setRace(character as { race: string }, e.currentTarget.value.trim().slice(0, 120))}
          maxlength="120"
          placeholder="ex. Canard, Den Den Mushi"
          autocomplete="off"
        />
      </label>
    {/if}
    {#if hasTribu(character)}
      <label class="wide">
        <span class="label">Tribu</span>
        <select bind:value={character.tribu}>
          {#each TRIBUS as [k, l] (k)}
            <option value={k as Tribu}>{l}</option>
          {/each}
        </select>
      </label>
    {/if}
    <label class="wide">
      <span class="label">Classe</span>
      <select value={mainClasse(character)} onchange={e => setClasse(character, e.currentTarget.value as Classe | '')}>
        <option value="">—</option>
        {#each CLASSES as cl (cl)}
          <option value={cl}>{cl}</option>
        {/each}
      </select>
    </label>
    <label class="wide">
      <span class="label">Rêve</span>
      <textarea bind:value={character.reve} maxlength="2000" placeholder="La raison de prendre la mer"></textarea>
    </label>
    <label class="wide">
      <span class="label">Prime (฿)</span>
      <input
        value={character.prime === null ? '' : primeDigits(character.prime)}
        onchange={e => commitPrime(e.currentTarget)}
        inputmode="numeric"
        placeholder="ex. 30 000 000 (vide = pas de prime)"
        autocomplete="off"
      />
    </label>
  </div>
{:else}
  <div class="view">
    {#if character.titre}<p class="titre">{character.titre}</p>{/if}
    {#if summary}<p class="summary">{summary}</p>{/if}
    {#if character.reve}<p class="summary reve"><span class="strong">Rêve :</span> {character.reve}</p>{/if}
    {#if character.prime !== null}
      <p class="summary"><span class="strong">Prime :</span> {formatPrime(character.prime)}</p>
    {/if}
    {#if !character.titre && !summary && !character.reve && character.prime === null}
      <p class="summary hint">Surnom, race, classe, rêve, prime… : touche le crayon pour remplir.</p>
    {/if}
  </div>
{/if}
</section>

<style>
  .form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .form label {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .wide {
    grid-column: 1 / -1;
  }
  .view {
    display: grid;
    gap: 4px;
  }
  .view p {
    margin: 0;
  }
  .titre {
    font-style: italic;
    font-size: 1.05rem;
  }
  .summary {
    color: var(--muted);
  }
  .hint {
    font-size: 0.9rem;
  }
  .reve {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .strong {
    font-weight: 600;
  }
  h2 {
    margin: 0 0 8px;
  }
</style>
