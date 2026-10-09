<script lang="ts">
  import { parseIntInput } from '../rules/numbers'

  // Champ entier : la saisie est validée à la sortie du champ (ou Entrée) puis passée à `onCommit`,
  // qui applique la règle. L'affichage reprend toujours la valeur réellement retenue.
  let {
    value,
    onCommit,
    label,
    id,
    signed = false,
  }: { value: number; onCommit: (n: number) => void; label: string; id?: string; signed?: boolean } = $props()

  let input: HTMLInputElement
  const show = (n: number) => (signed && n > 0 ? `+${n}` : String(n))

  $effect(() => {
    if (document.activeElement !== input) input.value = show(value)
  })

  function commit() {
    const n = parseIntInput(input.value)
    if (n !== null) onCommit(n)
    input.value = show(value)
  }
</script>

<input
  bind:this={input}
  {id}
  type="text"
  inputmode={signed ? 'text' : 'numeric'}
  autocomplete="off"
  aria-label={label}
  onchange={commit}
  onfocus={() => input.select()}
  onkeydown={e => {
    if (e.key === 'Enter') input.blur()
  }}
/>

<style>
  input {
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
</style>
