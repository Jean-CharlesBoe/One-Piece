<script lang="ts">
  import Sheet from '@onepiece/core/ui/Sheet.svelte'
  import { onMount } from 'svelte'
  import { asCopy, backupFileName, backupStatus, buildBackup, parseBackup } from '../backup/format'
  import { offerFile } from '../backup/share'
  import type { Character, CharacterSummary } from '../model/character'
  import { getRepository, META_LAST_BACKUP } from '../storage/repository'

  // Sauvegarde de tous les personnages dans un fichier (seule vraie protection contre la perte ou le
  // changement de téléphone) et import, avec un choix par personnage (cahier joueur §4.0, D-T4).
  let { characters, onImported }: { characters: CharacterSummary[]; onImported: () => void } = $props()

  type Choice = 'importer' | 'remplacer' | 'copie' | 'ignorer'
  interface Pending {
    character: Character
    existing: CharacterSummary | undefined
    choice: Choice
  }

  let lastBackup = $state<string | null>(null)
  let busy = $state(false)
  let message = $state('')
  let error = $state('')
  let fileInput: HTMLInputElement
  let importOpen = $state(false)
  let pending = $state<Pending[]>([])
  let importWarnings = $state<string[]>([])

  const status = $derived(backupStatus(lastBackup, characters))

  onMount(async () => {
    lastBackup = await (await getRepository()).getMeta(META_LAST_BACKUP)
  })

  const errText = (e: unknown) => (e instanceof Error ? e.message : String(e))

  async function save() {
    busy = true
    message = error = ''
    try {
      const repo = await getRepository()
      const all: Character[] = []
      for (const s of characters) {
        const c = await repo.get(s.id)
        if (c) all.push(c)
      }
      const now = new Date()
      const shared = await offerFile(backupFileName(now), JSON.stringify(buildBackup(all, __APP_VERSION__, now), null, 1))
      if (shared) {
        lastBackup = now.toISOString()
        await repo.setMeta(META_LAST_BACKUP, lastBackup)
        message = `${all.length} personnage${all.length > 1 ? 's' : ''} sauvegardé${all.length > 1 ? 's' : ''}.`
      }
    } catch (e) {
      error = 'Sauvegarde impossible : ' + errText(e)
    } finally {
      busy = false
    }
  }

  async function pickFile() {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    if (!file) return
    message = error = ''
    try {
      const { characters: found, warnings } = parseBackup(await file.text())
      pending = found.map(c => {
        const existing = characters.find(s => s.id === c.id)
        return { character: c, existing, choice: existing ? 'remplacer' : 'importer' }
      })
      importWarnings = warnings
      importOpen = true
    } catch (e) {
      error = errText(e)
    }
  }

  async function confirmImport() {
    busy = true
    try {
      const repo = await getRepository()
      let n = 0
      for (const p of pending) {
        if (p.choice === 'ignorer') continue
        const c = $state.snapshot(p.character)
        await repo.save(p.choice === 'copie' ? asCopy(c) : c)
        n++
      }
      importOpen = false
      message = n ? `${n} personnage${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''}.` : 'Rien importé.'
      onImported()
    } catch (e) {
      error = 'Import impossible : ' + errText(e)
    } finally {
      busy = false
    }
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
</script>

<section class="card" class:warn={status.warn} aria-labelledby="backup-title">
  <h2 class="label" id="backup-title">Sauvegarde</h2>
  {#if status.text}
    <p class="status">{status.text}{status.warn ? ' Pense à sauvegarder !' : ''}</p>
  {/if}
  <p class="hint">
    Le fichier contient tous tes personnages. Envoie-le sur ton Drive ou par message : il permet de tout récupérer
    sur un autre téléphone.
  </p>
  <div class="buttons">
    <button class="primary" onclick={save} disabled={busy || characters.length === 0}>Sauvegarder</button>
    <button onclick={() => fileInput.click()} disabled={busy}>Importer</button>
  </div>
  <input bind:this={fileInput} type="file" class="visually-hidden" tabindex="-1" aria-hidden="true" onchange={pickFile} />
  {#if message}<p class="ok" role="status">{message}</p>{/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</section>

<Sheet bind:open={importOpen} title="Importer">
  <ul>
    {#each pending as p (p.character.id)}
      <li>
        <div>
          <strong>{p.character.nom || 'Sans nom'}</strong>
          <span class="meta">
            {p.existing ? `déjà présent (modifié le ${fmtDate(p.existing.updatedAt)})` : 'nouveau'}
          </span>
        </div>
        <select bind:value={p.choice} aria-label="Action pour {p.character.nom}">
          {#if p.existing}
            <option value="remplacer">Remplacer</option>
            <option value="copie">Garder les deux</option>
          {:else}
            <option value="importer">Importer</option>
          {/if}
          <option value="ignorer">Ignorer</option>
        </select>
      </li>
    {/each}
  </ul>
  {#if importWarnings.length}
    <details>
      <summary>{importWarnings.length} correction{importWarnings.length > 1 ? 's' : ''} appliquée{importWarnings.length > 1 ? 's' : ''}</summary>
      <ul class="warnings">
        {#each importWarnings as w, i (i)}<li>{w}</li>{/each}
      </ul>
    </details>
  {/if}
  <p class="hint">« Remplacer » écrase la fiche du téléphone par celle du fichier.</p>
  <button class="primary confirm" onclick={confirmImport} disabled={busy}>Importer</button>
</Sheet>

<style>
  section.warn {
    border-color: var(--danger);
  }
  h2 {
    margin: 0;
  }
  .status {
    margin: 6px 0 0;
    font-weight: 600;
  }
  .warn .status {
    color: var(--danger);
  }
  .hint {
    margin: 6px 0 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }
  .ok {
    margin: 8px 0 0;
    color: var(--up);
  }
  .error {
    margin: 8px 0 0;
    color: var(--danger);
  }
  ul {
    list-style: none;
    margin: 16px 0 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  li {
    display: grid;
    grid-template-columns: 1fr 150px;
    align-items: center;
    gap: 8px;
  }
  li div {
    display: grid;
    min-width: 0;
  }
  .meta {
    font-size: 0.8rem;
    color: var(--muted);
  }
  details {
    margin-top: 12px;
    font-size: 0.85rem;
  }
  .warnings {
    margin-top: 6px;
    gap: 4px;
  }
  .warnings li {
    display: list-item;
    color: var(--muted);
  }
  .confirm {
    width: 100%;
    margin-top: 12px;
  }
</style>
