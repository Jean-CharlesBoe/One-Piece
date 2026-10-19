import { strToU8 } from 'fflate'
import { describe, expect, it } from 'vitest'
import { emptyBackupData, makeManifest, packBackup, readBackup } from '../../../apps/mj/src/lib/backup/format'
import type { Entity } from '../../../apps/mj/src/lib/model/entity'
import { convert, groupKey, splitName, splitRules, type ImportConfig } from './convert'
import { listValues, parsePage, readExportFiles, relatedIds, resolvePath } from './notion'

// Mini-export inventé (IMPORT_NOTION §6) : même structure que l'export réel « Markdown & CSV ».
const id = (n: number) => n.toString(16).padStart(32, 'a')
const ROOT = `Monde ${id(1)}.md`
const P = 'Monde/Persos 1234-abcd'

const EXPORT: Record<string, string | Uint8Array> = {
  [ROOT]: `# Monde\n\n## Session 1 12/03/25\n\n---\n\n[Note de Session](Monde/Note%20de%20Session%20${id(30)}.md)\n\n## Session 2\n02/04/25\n\n[Idée](Monde/Id%C3%A9e%20${id(31)}.md)\n`,
  'Monde/Persos abcd.csv': 'Nom\n',
  'Monde/Persos 1234abcd_all.csv': 'Nom\n',
  [`${P}/Kalo (Bertrand) ${id(2)}.md`]:
    `# Kalo (Bertrand)\n\nÉtiquettes: PJ, Bande du Phare\nNavire: Joueur\nRace: Anges (../Races/Anges%20${id(10)}.md)\nClasse: Médecin (../Classes/M%C3%A9decin%20${id(11)}.md)\nÉtat: En vie\n\nAmi de [Nora](Nora%20${id(3)}.md), cherche [Inconnu](Inconnu%20${id(99)}.md).\n\n![photo.jpg](Kalo%20(Bertrand)/photo.jpg)\n`,
  [`${P}/Kalo (Bertrand)/photo.jpg`]: new Uint8Array([1, 2, 3]),
  [`${P}/Nora, la pirate ${id(3)}.md`]:
    `# Nora, la pirate\n\nÉtiquettes: PNJ, Vice-Amiral, Contre Amiral, Phare, Les Brumes, South Blue\nGroupe: Les Gardiens du Phare (../Groupes/Les%20Gardiens%20du%20Phare%20${id(20)}.md)\nFiche de personnage: Nora/01_Nora.pdf\n\nTexte.\n`,
  [`${P}/Nora/01_Nora.pdf`]: new Uint8Array([4, 5]),
  'Monde/Groupes abcd.csv': 'Nom\n',
  [`Monde/Groupes/Les Gardiens du Phare ${id(20)}.md`]: `# Les Gardiens du Phare\n\nPersos: Kalo (Bertrand) (../Persos%201234-abcd/Kalo%20(Bertrand)%20${id(2)}.md)\n`,
  [`Monde/Groupes/Sans titre ${id(21)}.md`]: '# Sans titre\n',
  'Monde/Races abcd.csv': 'Nom\n',
  [`Monde/Races/Anges ${id(10)}.md`]: '# Anges\n\nÉtiquettes: Anges\nAvantage: Finesse\nCompétence de Race: Vol\n',
  'Monde/Classes abcd.csv': 'Nom\n',
  [`Monde/Classes/Médecin ${id(11)}.md`]: '# Médecin \n',
  'Monde/Lieux abcd.csv': 'Nom\n',
  [`Monde/Lieux 1234-abcd/Île Brune ${id(12)}.md`]: '# Île Brune\n\nLocalisation: South Blue\n\nUne île.\n',
  'Monde/Evènements abcd.csv': 'Nom\n',
  [`Monde/Evènements/Année 1500 ${id(13)}.md`]: '# Année 1500\n\nÉtiquettes: Historique\n\n- Un fait.\n',
  [`Monde/Règles ${id(14)}.md`]: '# Règles\n\nIntro.\n\n# 1. Les dés\n\nTexte 1.\n\n# **2. Le combat**\n\n![image.png](R%C3%A8gles/image.png)\n',
  'Monde/Règles/image.png': new Uint8Array([9]),
  [`Monde/Textes ${id(15)}.md`]: `# Textes\n\nOwner: MJ\n\n[Scénario 1](Textes/Sc%C3%A9nario%201%20${id(16)}.md)\n`,
  [`Monde/Textes/Scénario 1 ${id(16)}.md`]: `# Scénario 1\n\nOwner: MJ\n\n[Le Nord](Sc%C3%A9nario%201/Le%20Nord%20${id(17)}.md)\n\n[La légende](Sc%C3%A9nario%201/La%20l%C3%A9gende%20${id(18)}.md)\n`,
  [`Monde/Textes/Scénario 1/Le Nord ${id(17)}.md`]: '# Le Nord\n\nDes champs.\n',
  [`Monde/Textes/Scénario 1/La légende ${id(18)}.md`]: '# La légende\n\nIl était une fois.\n',
  [`Monde/Note de Session ${id(30)}.md`]: '# Note de Session\n\nRésumé.\n',
  [`Monde/Idée ${id(31)}.md`]: '# Idée\n\nPlus tard.\n',
}

const CONFIG: ImportConfig = {
  synonymes: [
    { type: 'race', reference: 'Skypiéens', alias: ['Anges'] },
    { type: 'lieu', reference: 'Île Brune', alias: ['Phare'] },
  ],
  parents: { 'Le Nord': 'Île Brune' },
}

function run() {
  const files = new Map(Object.entries(EXPORT).map(([k, v]) => [k, typeof v === 'string' ? strToU8(v) : v]))
  return convert(readExportFiles(files), CONFIG, '2026-10-19T10:00:00.000Z')
}

const find = (list: Entity[], type: string, title: string) => {
  const e = list.find(x => x.type === type && x.title === title)
  if (!e) throw new Error(`${type} « ${title} » absente`)
  return e
}

describe('lecture de l’export', () => {
  it('titre, propriétés en tête de page, texte', () => {
    const p = parsePage('# Kalo\n\nRace: Anges (../Races/Anges a.md)\nÉtat: En vie\n\nTexte : avec deux-points.\n', true)
    expect(p).toEqual({ title: 'Kalo', props: { Race: 'Anges (../Races/Anges a.md)', État: 'En vie' }, body: 'Texte : avec deux-points.' })
    // Hors base de données, seules les propriétés connues sont lues.
    expect(parsePage('# Page\n\nChaque île: une spécialité\n', false).props).toEqual({})
  })

  it('valeurs de propriétés, relations, chemins', () => {
    expect(listValues(`PNJ, Marine`)).toEqual(['PNJ', 'Marine'])
    expect(listValues(`Kalo (Bertrand) (../P/Kalo%20(Bertrand)%20${id(2)}.md), Nora (../P/Nora%20${id(3)}.md)`)).toEqual(['Kalo (Bertrand)', 'Nora'])
    expect(relatedIds(`Kalo (../P/Kalo%20(B)%20${id(2)}.md)`)).toEqual([id(2)])
    expect(resolvePath('Monde/Persos', '../R%C3%A8gles/image.png')).toBe('Monde/Règles/image.png')
  })

  it('noms de personnages : parenthèse, virgule, tiret, surnom entre guillemets', () => {
    expect(splitName('Osmo (Mérou)')).toEqual({ title: 'Osmo', aliases: ['Osmo (Mérou)', 'Mérou'] })
    expect(splitName('Shanks, le démon rouge')).toEqual({ title: 'Shanks', aliases: ['Shanks, le démon rouge'] })
    expect(splitName('Brem - Gardien du phare').title).toBe('Brem')
    expect(splitName('Tomo "Le Rêveur”')).toEqual({ title: 'Tomo', aliases: ['Tomo « Le Rêveur »'] })
    expect(splitName('Valdo')).toEqual({ title: 'Valdo', aliases: [] })
  })

  it('clé souple des noms de groupes', () => {
    expect(groupKey('L’Equipage des Fleurs')).toEqual(['fleur'])
    expect(groupKey('Battle Crew / Charpentiers Errants')).toEqual(groupKey('Battle Crew ou Charpentier Errant'))
  })

  it('règles : une fiche par titre de niveau 1', () => {
    const r = splitRules({ title: 'Règles', body: 'Intro.\n\n# 1. Les dés\n\nA\n\n# **2. Le combat**\n\nB' } as never)
    expect(r.map(s => [s.section, s.title])).toEqual([['1', 'Les dés'], ['2', 'Le combat']])
    expect(r[0].body).toBe('Intro.\n\nA')
  })
})

describe('conversion', () => {
  const { entities, assets, media, report } = run()

  it('personnage : titre, alias, rôle, alignement, race (synonyme), classe, origine, grade', () => {
    const kalo = find(entities, 'personnage', 'Kalo')
    expect(kalo.aliases).toEqual(['Kalo (Bertrand)', 'Bertrand'])
    expect(kalo.props).toMatchObject({ role: 'PJ', alignement: 'Joueur', etat: 'En vie' })
    expect(kalo.props.race).toBe(find(entities, 'race', 'Skypiéens').id)
    expect(kalo.props.classes).toEqual([find(entities, 'classe', 'Médecin').id])
    const nora = find(entities, 'personnage', 'Nora')
    expect(nora.props).toMatchObject({ role: 'PNJ', grade: 'Vice-amiral', mer: 'South Blue', origine: find(entities, 'lieu', 'Île Brune').id })
    expect(report.warnings['Valeurs multiples']).toEqual([expect.stringContaining('Vice-amiral, Contre-amiral')])
  })

  it('factions : groupe, étiquette rapprochée, faction créée, membres cités par le groupe', () => {
    const gardiens = find(entities, 'faction', 'Les Gardiens du Phare')
    const brumes = find(entities, 'faction', 'Les Brumes')
    expect(find(entities, 'personnage', 'Nora').props.factions).toEqual([gardiens.id, brumes.id])
    // « Bande du Phare » ne ressemble à aucun groupe connu : faction créée ; Kalo rejoint aussi les Gardiens (cité par le groupe).
    expect(find(entities, 'personnage', 'Kalo').props.factions).toEqual([find(entities, 'faction', 'Bande du Phare').id, gardiens.id])
    expect(report.factionsCreated).toEqual(['Bande du Phare', 'Les Brumes'])
    expect(entities.some(e => e.title === 'Sans titre')).toBe(false)
  })

  it('race, classe, lieu, événement : propriétés et valeurs des règles', () => {
    expect(find(entities, 'race', 'Skypiéens')).toMatchObject({
      aliases: ['Anges'],
      props: { avantage: 'Finesse', capacites: 'Compétence de race : Vol', vitaliteBase: 20, enduranceBase: 25 },
    })
    expect(find(entities, 'classe', 'Médecin').props).toEqual({ avantages: 'Savoir-faire, Finesse', desavantages: 'Volonté' })
    expect(find(entities, 'lieu', 'Île Brune')).toMatchObject({ props: { mer: 'South Blue' }, bodyMd: 'Une île.' })
    expect(find(entities, 'evenement', 'Année 1500').props).toEqual({ categorie: 'Historique', dateMonde: '1500' })
  })

  it('pages : règles découpées, sommaire ignoré, scénario et sous-pages, rangement de la configuration, sessions', () => {
    expect(entities.filter(e => e.type === 'regle').map(e => e.title)).toEqual(['Les dés', 'Le combat'])
    expect(entities.some(e => e.title === 'Textes')).toBe(false)
    expect(report.skipped).toEqual(expect.arrayContaining([expect.stringContaining('Textes'), expect.stringContaining('Sans titre')]))
    const sc = find(entities, 'scenario', 'Scénario 1')
    const ile = find(entities, 'lieu', 'Île Brune')
    expect(find(entities, 'note', 'Le Nord').parentId).toBe(ile.id)
    expect(sc.props.lieux).toEqual([ile.id])
    expect(find(entities, 'note', 'La légende').parentId).toBe(sc.id)
    expect(find(entities, 'note', 'Session 1 (12/03/25) — Note de session').tags).toEqual(['session'])
    expect(find(entities, 'note', 'Session 2 (02/04/25) — Idée').parentId).toBeNull()
  })

  it('liens, images et fiches de personnage en PDF', () => {
    const kalo = find(entities, 'personnage', 'Kalo')
    const nora = find(entities, 'personnage', 'Nora')
    expect(kalo.bodyMd).toContain(`[[${nora.id}|Nora]]`)
    expect(kalo.bodyMd).toContain('[[?|Inconnu]]')
    expect(report.warnings['Liens cassés']).toHaveLength(1)
    const photo = assets.find(a => a.original_name === 'photo.jpg')!
    expect(kalo.bodyMd).toContain(`![image](asset:${photo.id})`)
    expect(media[String(photo.file_name)]).toEqual(new Uint8Array([1, 2, 3]))
    const doc = find(entities, 'document', 'Fiche de personnage — Nora')
    expect(doc.parentId).toBeNull()
    expect(doc.props).toEqual({ fichier: assets.find(a => a.original_name === '01_Nora.pdf')!.id, rattacheA: [nora.id] })
    expect(find(entities, 'regle', 'Le combat').bodyMd).toMatch(/^!\[image\]\(asset:/)
  })

  it('sauvegarde .opmj relue par l’app', () => {
    const data = { ...emptyBackupData(), entities, assets }
    const bytes = packBackup(makeManifest(data, { lastChangeAt: null, appVersion: 'test', device: 'test' }), data, media)
    const back = readBackup(bytes)
    expect(back.data.entities).toHaveLength(entities.length)
    expect(back.data.assets).toHaveLength(assets.length)
    expect(back.warnings).toEqual([])
  })
})
