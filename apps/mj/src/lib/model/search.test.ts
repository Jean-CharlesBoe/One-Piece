import { describe, expect, it } from 'vitest'
import { ftsQuery, MARK_END, MARK_START, rankScore, searchWords, snippetHtml } from './search'

describe('recherche', () => {
  it('mots nettoyés, sans syntaxe MATCH ni accents', () => {
    expect(searchWords('  Île du SUD ')).toEqual(['ile', 'du', 'sud'])
    expect(ftsQuery('sky "or" (ang')).toBe('sky* or* ang*')
    expect(ftsQuery('*** ')).toBe('')
  })

  it('extrait : échappé, puis surligné', () => {
    expect(snippetHtml(`a <b> ${MARK_START}fumée${MARK_END} & co`)).toBe('a &lt;b&gt; <mark>fumée</mark> &amp; co')
  })

  it('classement : nom exact, début de nom, nom contenu, mots du nom, le reste', () => {
    const e = (title: string, aliases: string[] = []) => ({ id: title, title, aliases })
    expect(rankScore('smoker', e('Smoker'))).toBe(0)
    expect(rankScore('smo', e('Smoker'))).toBe(1)
    expect(rankScore('blanc', e('Smoker', ['Chasseur blanc']))).toBe(2)
    expect(rankScore('sud ile', e('Île du Sud'))).toBe(3)
    expect(rankScore('cigare', e('Smoker'))).toBe(4)
  })
})
