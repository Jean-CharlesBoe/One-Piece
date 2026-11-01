import { describe, expect, it } from 'vitest'
import { createEntity } from './entity'
import { bodyMarkdown, entityMarkdown, markdownFileName } from './export'
import { createGameBlock, type GameBlock } from './gameBlock'

describe('export Markdown (M9)', () => {
  it('fiche : titre, type et alias, propriétés lisibles, étiquettes, texte sans [[liens]]', () => {
    const e = createEntity('personnage', 'Smoker')
    e.aliases = ['Chasseur blanc']
    e.tags = ['marine']
    e.props = { role: 'PNJ', etat: 'En vie', age: '36' }
    e.bodyMd = 'Poursuit [[abc|Luffy]] | sans relâche.\n\n![Portrait](asset:img1)'
    const md = entityMarkdown(e, () => '', id => (id === 'img1' ? 'smoker.png' : ''))
    expect(md).toBe(
      [
        '# Smoker',
        '',
        '*Personnage · aussi appelé : Chasseur blanc*',
        '',
        '| Propriété | Valeur |',
        '|---|---|',
        '| Rôle | PNJ |',
        '| État | En vie |',
        '| Âge | 36 |',
        '',
        'Étiquettes : marine',
        '',
        'Poursuit Luffy | sans relâche.',
        '',
        '*[image : Portrait]*',
        '',
      ].join('\n'),
    )
  })

  it('bloc de jeu résumé : caracs (bonus compris), ressources, techniques', () => {
    const e = createEntity('personnage', 'Drake')
    const b: GameBlock = createGameBlock()
    b.stats.robustesse.valeur = 12
    b.bonusTemporaires = [{ id: 'x', carac: 'robustesse', valeur: 3, origine: '' }]
    b.ressources.vitalite = { cur: 40, max: 60, regeneration: '' }
    b.competences = [{ id: 's', titre: 'Coup de queue', cout: 5, origine: 'combat', description: 'Frappe\nlourde' }]
    e.props = { role: 'PNJ', jeu: b }
    const md = entityMarkdown(e, () => '')
    expect(md).toContain('## Bloc de jeu')
    expect(md).toContain('Robustesse 15 (base 12)')
    expect(md).toContain('Vitalité 40/60')
    expect(md).toContain('- **Coup de queue** (5 Endurance) : Frappe lourde')
  })

  it('médias et nom de fichier', () => {
    expect(bodyMarkdown('[Carte](asset:a1)', () => 'carte.pdf')).toBe('Carte *(fichier joint)*')
    expect(bodyMarkdown('[](asset:a1)', () => 'carte.pdf')).toBe('carte.pdf *(fichier joint)*')
    expect(markdownFileName('Île: du/Sud?')).toBe('Île du Sud.md')
    expect(markdownFileName('...')).toBe('fiche.md')
  })
})
