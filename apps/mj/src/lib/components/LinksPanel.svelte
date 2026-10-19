<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import type { CatalogEntry } from '../model/entity'
  import { relationIds } from '../model/props'
  import { fieldOf, TYPE_DEFS } from '../model/types'
  import { opened } from '../opened.svelte'
  import { getRepository, type Backlink } from '../storage/repository'

  // Panneau Liens (cahier MJ §4.2) : relations sortantes, rétroliens (par propriété, puis « Mentionné dans »),
  // pages enfants. La chronologie (journal) arrive avec les sessions (M8).
  let { onOpen, onAddChild }: { onOpen: (id: string) => void; onAddChild: () => void } = $props()

  const entity = $derived(opened.entity)
  let backlinks = $state<Backlink[]>([])

  // Rétroliens relus à l'ouverture d'une fiche, et quand le catalogue change (une autre fiche enregistrée).
  $effect(() => {
    const id = entity?.id
    void catalog.entries
    if (!id) {
      backlinks = []
      return
    }
    getRepository()
      .then(r => r.backlinks(id))
      .then(b => {
        if (opened.entity?.id === id) backlinks = b
      })
      .catch(e => console.error('[onepiece-mj] rétroliens', e))
  })

  interface Group {
    title: string
    entries: CatalogEntry[]
  }

  const outgoing = $derived.by((): Group[] => {
    if (!entity) return []
    return TYPE_DEFS[entity.type].fields
      .filter(f => f.field.kind === 'relation')
      .map(f => ({
        title: f.label,
        entries: relationIds(entity.props[f.key]).flatMap(id => catalog.byId.get(id) ?? []),
      }))
      .filter(g => g.entries.length)
  })

  /** Rétroliens groupés : titre inverse de la propriété source (« Membres », « Détenteur »…), mentions en dernier. */
  const incoming = $derived.by((): Group[] => {
    const groups = new Map<string, CatalogEntry[]>()
    const mentions: CatalogEntry[] = []
    for (const b of backlinks) {
      const from = catalog.byId.get(b.fromId)
      if (!from || from.archived) continue
      if (b.kind === 'mention') {
        if (!mentions.some(m => m.id === from.id)) mentions.push(from)
        continue
      }
      const f = fieldOf(from.type, b.kind)
      const title = f?.field.kind === 'relation' ? f.field.inverse : b.kind
      const list = groups.get(title) ?? []
      if (!list.some(m => m.id === from.id)) list.push(from)
      groups.set(title, list)
    }
    const out = [...groups].map(([title, entries]) => ({ title, entries }))
    const listed = new Set(out.flatMap(g => g.entries.map(e => e.id)))
    const others = mentions.filter(m => !listed.has(m.id))
    if (others.length) out.push({ title: 'Mentionné dans', entries: others })
    return out
  })

  const children = $derived(entity ? catalog.active.filter(e => e.parentId === entity.id) : [])
</script>

<aside class="links" aria-label="Liens">
  <h2>Liens</h2>
  {#if entity}
    {#each [...outgoing, ...incoming] as g (g.title)}
      <section>
        <h3 class="label">{g.title}</h3>
        <ul>
          {#each g.entries as e (e.id)}
            <li>
              <a
                href="#{e.id}"
                onclick={ev => (ev.preventDefault(), onOpen(e.id))}
                onauxclick={ev => ev.button === 1 && (ev.preventDefault(), onOpen(e.id))}
              >
                <span aria-hidden="true">{TYPE_DEFS[e.type].icon}</span>
                {e.title}
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}

    <section>
      <h3 class="label">Pages enfants</h3>
      {#if children.length}
        <ul>
          {#each children as e (e.id)}
            <li>
              <a
                href="#{e.id}"
                onclick={ev => (ev.preventDefault(), onOpen(e.id))}
                onauxclick={ev => ev.button === 1 && (ev.preventDefault(), onOpen(e.id))}
              >
                <span aria-hidden="true">{TYPE_DEFS[e.type].icon}</span>
                {e.title}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
      {#if !entity.archived}<button class="add" onclick={onAddChild}>+ Page enfant</button>{/if}
    </section>

    {#if !outgoing.length && !incoming.length}
      <p class="empty">Aucune relation ni mention pour l'instant.</p>
    {/if}

    <section>
      <h3 class="label">Chronologie</h3>
      <p class="empty">Les entrées du journal de session apparaîtront ici (étape M8).</p>
    </section>
  {:else}
    <p class="empty">Les liens de la fiche ouverte s'affichent ici.</p>
  {/if}
</aside>

<style>
  .links {
    height: 100%;
    overflow-y: auto;
    padding: 12px 14px;
  }
  h2 {
    margin: 0 0 12px;
    font-size: 1.05rem;
  }
  section {
    margin-bottom: 14px;
  }
  h3 {
    margin: 0 0 4px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li a {
    display: flex;
    gap: 6px;
    align-items: center;
    min-height: 40px;
    color: var(--text);
    text-decoration: none;
  }
  li a:hover {
    color: var(--accent);
    text-decoration: underline;
  }
  .add {
    min-height: 30px;
    padding: 0 10px;
    margin-top: 4px;
    font-size: 0.85rem;
  }
  .empty {
    margin: 0 0 12px;
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
