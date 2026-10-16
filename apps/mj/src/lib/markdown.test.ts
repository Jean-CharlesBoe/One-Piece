import { describe, expect, it } from 'vitest'
import { markdownToHtml } from './markdown'

const exists = (id: string) => id === 'a1'

describe('rendu Markdown', () => {
  it('liens internes, liens rouges, fiche disparue', () => {
    const html = markdownToHtml('Vu à [[a1|Loguetown]], [[?|Smoker]] et [[zz|Ancienne]].', exists)
    expect(html).toContain('<a href="#" class="wl" data-id="a1">Loguetown</a>')
    expect(html).toContain('<a href="#" class="wl missing" data-create="Smoker" title="Fiche à créer">Smoker</a>')
    expect(html).toContain('data-create="Ancienne"')
  })

  it('titres, listes, tableaux (export Notion)', () => {
    const html = markdownToHtml('## Île\n\n- un\n- deux\n\n| A | B |\n|---|---|\n| 1 | 2 |', exists)
    expect(html).toContain('<h2>Île</h2>')
    expect(html).toContain('<li>un</li>')
    expect(html).toContain('<table>')
  })

  it('titre de lien échappé, images de médias en attente', () => {
    expect(markdownToHtml('[[a1|<b>x</b>]]', exists)).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(markdownToHtml('![Carte](asset:42)', exists)).toContain('[image : Carte]')
  })
})
