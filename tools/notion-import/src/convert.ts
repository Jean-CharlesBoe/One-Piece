import { CLASSE_INFO, newId, RACE_INFO, RACES, statLabel, type Classe } from '@onepiece/core'
import type { RawRow } from '../../../apps/mj/src/lib/backup/format'
import { createEntity, type Entity } from '../../../apps/mj/src/lib/model/entity'
import { MISSING, nameKey, wikiLink } from '../../../apps/mj/src/lib/model/links'
import { normalizeEntity } from '../../../apps/mj/src/lib/model/normalize'
import { TYPE_DEFS, type EntityType } from '../../../apps/mj/src/lib/model/types'
import { listValues, relatedIds, resolvePath, type NotionExport, type Page } from './notion'

// Conversion des pages Notion en fiches de l'appli MJ (IMPORT_NOTION §4). Pur : ne lit ni n'écrit de fichier.
// Ce qui est propre au monde du MJ (noms de factions, de lieux…) vient de la configuration privée
// (`input/import.json`, ignorée par git), jamais du code.

export interface Synonym {
  /** Type de fiche, ou « grade » (étiquette de grade des personnages). */
  type: EntityType | 'grade'
  reference: string
  alias: string[]
}

export interface ImportConfig {
  synonymes: Synonym[]
  /** Pages à ranger sous une autre fiche : titre de la page → titre (ou alias) de la fiche parente. */
  parents: Record<string, string>
}

export interface ImportResult {
  entities: Entity[]
  assets: RawRow[]
  /** Fichiers des médias, par `file_name`. */
  media: Record<string, Uint8Array>
  report: Report
}

export interface Report {
  /** Avertissements groupés par rubrique. */
  warnings: Record<string, string[]>
  factionsCreated: string[]
  synonymsApplied: string[]
  skipped: string[]
}

/** Bases de données Notion → type de fiche (nom du dossier, sans l'identifiant raccourci). */
const DATABASES: Record<string, EntityType> = {
  Persos: 'personnage',
  Groupes: 'faction',
  Lieux: 'lieu',
  Races: 'race',
  Classes: 'classe',
  'Fruit du démon': 'fruit',
  Evènements: 'evenement',
  Événements: 'evenement',
}

/** Étiquettes de grade de Notion → valeur de la liste « Grade ». */
const GRADES: Record<string, string> = {
  'amiral en chef': 'Amiral en chef',
  amiral: 'Amiral',
  'vice-amiral': 'Vice-amiral',
  'vice amiral': 'Vice-amiral',
  'contre-amiral': 'Contre-amiral',
  'contre amiral': 'Contre-amiral',
  'sous-amiral': 'Sous-amiral',
  'sous amiral': 'Sous-amiral',
  capitaine: 'Capitaine',
  shichibukai: 'Shichibukai',
}

const MERS = ['East Blue', 'West Blue', 'North Blue', 'South Blue', 'Grand Line', 'Nouveau Monde', 'Ciel', 'Sous-marin']

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
}

/** Nom d'une base de données d'après son dossier (`Persos f97d-0b0b` → `Persos`). */
const databaseName = (dir: string) => dir.slice(dir.lastIndexOf('/') + 1).replace(/ [0-9a-f]{4}-[0-9a-f]{4}$/, '')

/**
 * Titre et alias d'un personnage (Q-M7) : « Osmo (Mérou) » → « Osmo » + alias « Osmo (Mérou) », « Mérou » ;
 * « Shanks, le démon rouge » ou « Brem - Gardien du phare » → le nom avant la virgule ou le tiret, la forme
 * complète en alias.
 */
export function splitName(full: string): { title: string; aliases: string[] } {
  const clean = full.replace(/\s+/g, ' ').trim()
  const paren = /^(.+?)\s*\(\s*([^()]+?)\s*\)\s*$/.exec(clean)
  if (paren) return { title: paren[1], aliases: [clean, paren[2]] }
  const sep = /^(.+?)(?:\s*,\s+|\s+[-–—]\s+)(.+)$/.exec(clean)
  if (sep) return { title: sep[1], aliases: [clean] }
  const quoted = /^(.+?)\s+["“«](.+?)["”»]?\s*$/.exec(clean)
  if (quoted) return { title: quoted[1], aliases: [`${quoted[1]} « ${quoted[2].replace(/["”»]$/, '')} »`] }
  return { title: clean, aliases: [] }
}

/** Clé de comparaison souple d'un nom de groupe : sans articles, « équipage », ponctuation ni pluriels. */
export function groupKey(name: string): string[] {
  const STOP = new Set(['l', 'la', 'le', 'les', 'de', 'du', 'des', 'd', 'ou', 'et', 'equipage', 'the'])
  return nameKey(name)
    .replace(/[’'`/,.()-]/g, ' ')
    .split(' ')
    .filter(w => w && !STOP.has(w))
    .map(w => (w.length > 3 ? w.replace(/[sx]$/, '') : w))
}

const sameKey = (a: string, b: string) => nameKey(a) === nameKey(b)

export function convert(exp: NotionExport, config: ImportConfig, now = new Date().toISOString()): ImportResult {
  const report: Report = { warnings: {}, factionsCreated: [], synonymsApplied: [], skipped: [] }
  const warn = (topic: string, msg: string) => (report.warnings[topic] ??= []).push(msg)

  const byNotion = new Map<string, Entity>()
  const pageOf = new Map<Entity, Page>()
  const entities: Entity[] = []
  const assets: RawRow[] = []
  const media: Record<string, Uint8Array> = {}
  const assetOfPath = new Map<string, string>()
  const folders = new Map(exp.pages.map(p => [p.dir ? `${p.dir}/${p.name}` : p.name, p]))

  const make = (type: EntityType, title: string, page?: Page): Entity => {
    const e = createEntity(type, title)
    e.createdAt = e.updatedAt = now
    if (page) {
      e.notionId = page.notionId
      byNotion.set(page.notionId, e)
      pageOf.set(e, page)
    }
    entities.push(e)
    return e
  }

  // Synonymes (un nom de référence par chose, D-M8) : appliqués au titre de chaque fiche de ce type.
  const synonymFor = (type: EntityType | 'grade', names: string[]) =>
    config.synonymes.find(s => s.type === type && [s.reference, ...s.alias].some(n => names.some(x => sameKey(n, x))))
  const applySynonym = (e: Entity, extra: string[] = []) => {
    const s = synonymFor(e.type, [e.title, ...e.aliases, ...extra])
    if (!s) return
    if (!sameKey(s.reference, e.title)) report.synonymsApplied.push(`${TYPE_DEFS[e.type].label} « ${e.title} » → « ${s.reference} »`)
    addAliases(e, [e.title, ...s.alias])
    e.title = s.reference
  }

  // Page d'accueil : titres des sessions qui précèdent les liens vers les notes de session.
  const sessionOf = new Map<string, string>()
  const root = exp.pages.find(p => !p.dir)
  if (root) {
    let heading = ''
    let expectDate = false
    for (const line of root.body.split('\n')) {
      const h = /^#{1,3}\s+(.*)$/.exec(line)
      if (h) {
        heading = h[1].replace(/\*/g, '').trim().replace(/\s+(\d{1,2}\/\d{1,2}\/\d{2,4})$/, ' ($1)')
        expectDate = !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(heading)
        continue
      }
      const date = /^\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*$/.exec(line)
      if (date && expectDate) {
        heading = `${heading} (${date[1]})`
        expectDate = false
        continue
      }
      if (line.trim() && line.trim() !== '---') expectDate = false
      for (const id of relatedIds(line)) if (/^Session\b/i.test(heading)) sessionOf.set(id, heading)
    }
  }

  /** Page dont celle-ci est une sous-page (la page d'accueil de l'espace n'en est pas une : pas de fiche). */
  const parentPageOf = (p: Page) => {
    const parent = folders.get(p.dir)
    return parent === root ? undefined : parent
  }

  // 1. Une fiche par page (les règles : une fiche par titre de niveau 1).
  const ruleSections = new Map<string, Entity>()
  for (const page of exp.pages) {
    if (page === root) continue
    const db = DATABASES[databaseName(page.dir)]
    const parent = parentPageOf(page)
    const empty = !page.body.trim() && Object.values(page.props).every(v => !v)
    if (!page.title || (/^sans titre$/i.test(page.title) && empty)) {
      report.skipped.push(`${page.path} (page vide)`)
      continue
    }
    if (db && !parent) {
      const e = make(db, page.title, page)
      if (db === 'personnage') {
        const n = splitName(page.title)
        e.title = n.title
        addAliases(e, n.aliases)
      }
      continue
    }
    if (/^r[èe]gles$/i.test(page.title) && !parent) {
      splitRules(page).forEach((s, i) => {
        const e = make('regle', s.title)
        e.notionId = page.notionId
        e.props = { section: s.section }
        e.sortOrder = i
        e.bodyMd = s.body
        pageOf.set(e, { ...page, body: s.body })
        if (i === 0) byNotion.set(page.notionId, e)
        ruleSections.set(`${page.notionId}:${i}`, e)
      })
      continue
    }
    // Page qui ne contient que des liens vers ses sous-pages (« Textes Importants ») : pas de fiche.
    if (!parent && isIndexPage(page, exp)) {
      report.skipped.push(`${page.path} (sommaire : ses sous-pages sont importées)`)
      continue
    }
    const type: EntityType = /^sc[ée]nario\b/i.test(page.title) ? 'scenario' : 'note'
    const session = sessionOf.get(page.notionId)
    const e = make(type, session ? `${session} — ${capitalizeFirst(page.title.toLowerCase())}` : page.title, page)
    // Notes de session : deviendront des sessions avec M8 (étiquette « session » pour les retrouver).
    if (session) e.tags = ['session']
  }

  // Synonymes sur les titres ; les étiquettes d'une race (« Lunariens ») deviennent des alias.
  for (const e of entities) {
    const page = pageOf.get(e)
    const tags = e.type === 'race' && page ? listValues(page.props['Étiquettes']) : []
    applySynonym(e, tags)
    if (e.type === 'race') addAliases(e, tags)
  }

  const named = (type: EntityType, name: string) =>
    entities.find(e => e.type === type && [e.title, ...e.aliases].some(n => sameKey(n, name)))
  const ids = (value: string | undefined, type: EntityType, who: string, label: string): string[] => {
    const out: string[] = []
    for (const nid of relatedIds(value)) {
      const t = byNotion.get(nid)
      if (t && t.type === type) out.push(t.id)
      else warn('Relations introuvables', `${who} : ${label} vers une page absente de l'export (${nid})`)
    }
    return [...new Set(out)]
  }

  // 2. Factions : celles de la base Groupes, puis celles des étiquettes des personnages.
  const factionFor = (tag: string, who: string): Entity => {
    const syn = synonymFor('faction', [tag])
    if (syn) {
      const f = named('faction', syn.reference) ?? createFaction(syn.reference)
      addAliases(f, syn.alias)
      return f
    }
    const exact = named('faction', tag)
    if (exact) return exact
    const k = groupKey(tag)
    const near = entities.filter(
      e => e.type === 'faction' && [e.title, ...e.aliases].some(n => {
        const g = groupKey(n)
        return k.length > 0 && k.every(w => g.includes(w))
      }),
    )
    if (near.length === 1) {
      warn('Étiquettes rapprochées d\'une faction', `${who} : « ${tag} » → « ${near[0].title} »`)
      addAliases(near[0], [tag])
      return near[0]
    }
    if (near.length > 1) warn('Étiquettes ambiguës', `${who} : « ${tag} » ressemble à ${near.map(f => `« ${f.title} »`).join(', ')} ; faction créée`)
    return createFaction(tag)
  }
  const createFaction = (title: string) => {
    report.factionsCreated.push(title)
    return make('faction', title)
  }

  // 3. Propriétés.
  const members: [string, string][] = []
  for (const e of [...entities]) {
    const page = pageOf.get(e)
    if (!page) continue
    const p = page.props
    const who = `${TYPE_DEFS[e.type].label} « ${e.title} »`
    const props: Record<string, unknown> = { ...e.props }
    switch (e.type) {
      case 'personnage': {
        const factions = ids(p['Groupe'], 'faction', who, 'Groupe')
        const grades: string[] = []
        for (const tag of listValues(p['Étiquettes'])) {
          const k = nameKey(tag)
          const grade = GRADES[k] ?? (synonymFor('grade', [tag]) ? GRADES[nameKey(synonymFor('grade', [tag])!.reference)] : undefined)
          const lieu = named('lieu', tag)
          if (k === 'pj' || k === 'pnj') props.role = k.toUpperCase()
          else if (grade) grades.push(grade)
          else if (/fiche perso a faire/.test(k)) props.aFaire = 'Oui'
          else if (MERS.some(m => sameKey(m, tag))) props.mer = MERS.find(m => sameKey(m, tag))
          else if (lieu) {
            if (props.origine && props.origine !== lieu.id) warn('Valeurs multiples', `${who} : plusieurs lieux d'origine, « ${tag} » ignoré`)
            else props.origine = lieu.id
          } else factions.push(factionFor(tag, who).id)
        }
        if (grades.length) props.grade = grades[0]
        if (grades.length > 1) warn('Valeurs multiples', `${who} : grades ${grades.join(', ')} → « ${grades[0]} » gardé`)
        props.factions = [...new Set(factions)]
        const navire = listValues(p['Navire'])
        if (navire.length) props.alignement = navire[0]
        if (navire.length > 1) warn('Valeurs multiples', `${who} : Navire ${navire.join(', ')} → « ${navire[0]} » gardé`)
        if (p['État']) props.etat = p['État']
        props.race = ids(p['Race'], 'race', who, 'Race')[0]
        props.classes = ids(p['Classe'], 'classe', who, 'Classe')
        props.fruit = ids(p['Fruit du démon'], 'fruit', who, 'Fruit du démon')[0]
        if (relatedIds(p['Fruit du démon']).length > 1) warn('Valeurs multiples', `${who} : plusieurs fruits du démon, le premier est gardé`)
        if (p['Technique de combat']) props.technique = p['Technique de combat']
        if (p['Fiche de personnage']) {
          for (const file of p['Fiche de personnage'].split(/,\s*(?=[^,]*\.\w{2,4}\s*(?:,|$))/)) {
            const asset = addAsset(resolvePath(page.dir, file.trim()), who)
            if (!asset) continue
            const doc = make('document', `Fiche de personnage — ${e.title}`)
            doc.props = { fichier: asset, rattacheA: [e.id] }
          }
        }
        break
      }
      case 'faction':
        // Les membres cités par le groupe rejoignent la faction (en plus de leur propriété Groupe).
        for (const pid of ids(p['Persos'], 'personnage', who, 'Persos')) members.push([pid, e.id])
        break
      case 'lieu': {
        if (p['Alignement']) props.alignement = listValues(p['Alignement'])[0]
        const mer = listValues(p['Localisation'])[0]
        if (mer) props.mer = MERS.find(m => sameKey(m, mer)) ?? mer
        props.affilies = ids(p['Persos affiliés'], 'personnage', who, 'Persos affiliés')
        if (relatedIds(p['Fait partie de / Contient']).length)
          warn('À relier à la main', `${who} : « Fait partie de / Contient » mêle les deux sens dans Notion ; à reprendre dans l'app`)
        if (p['Description']) e.bodyMd = p['Description']
        break
      }
      case 'race': {
        if (p['Avantage']) props.avantage = p['Avantage']
        if (p['Désavantage']) props.desavantage = p['Désavantage']
        const capacites = [
          p['Compétence de Race'] && `Compétence de race : ${p['Compétence de Race']}`,
          p['Malus de Race'] && `Malus de race : ${p['Malus de Race']}`,
        ].filter(Boolean)
        if (capacites.length) props.capacites = capacites.join('\n')
        const info = RACES.map(r => RACE_INFO[r]).find(r => [r.pluriel, ...r.alias].some(n => [e.title, ...e.aliases].some(x => sameKey(n, x))))
          ?? RACES.filter(r => [e.title, ...e.aliases].some(x => sameKey(r, x))).map(r => RACE_INFO[r])[0]
        if (info) {
          props.vitaliteBase = info.vitaliteBase
          props.enduranceBase = info.enduranceBase
        }
        break
      }
      case 'classe': {
        const c = (Object.keys(CLASSE_INFO) as Classe[]).find(k => sameKey(k, e.title))
        if (c) {
          props.avantages = statList(CLASSE_INFO[c].avantages)
          props.desavantages = statList(CLASSE_INFO[c].desavantages)
        }
        break
      }
      case 'fruit':
        if (p['Description']) e.bodyMd = p['Description']
        break
      case 'evenement': {
        const tags = listValues(p['Étiquettes'])
        if (tags.length) props.categorie = tags[0]
        if (tags.length > 1) warn('Valeurs multiples', `${who} : étiquettes ${tags.join(', ')} → « ${tags[0]} » gardée`)
        const year = /^Année\s+(\d{3,4})$/i.exec(e.title)
        if (year) props.dateMonde = year[1]
        break
      }
    }
    e.props = props
  }
  for (const [pid, fid] of members) {
    const m = entities.find(x => x.id === pid)!
    const list = (m.props.factions as string[] | undefined) ?? []
    if (!list.includes(fid)) m.props.factions = [...list, fid]
  }

  // 4. Pages enfants : rangées sous leur page, ou sous la fiche indiquée par la configuration.
  for (const e of entities) {
    const page = pageOf.get(e)
    if (!page) continue
    const parentPage = parentPageOf(page)
    const parent = parentPage && byNotion.get(parentPage.notionId)
    const target = Object.entries(config.parents).find(([t]) => sameKey(t, page.title))?.[1]
    if (target) {
      const p = entities.find(x => [x.title, ...x.aliases].some(n => sameKey(n, target)))
      if (!p) warn('Configuration', `parent « ${target} » introuvable pour « ${page.title} »`)
      else {
        e.parentId = p.id
        // Une page de scénario rangée sous un lieu : le scénario cite ce lieu.
        if (parent?.type === 'scenario' && p.type === 'lieu') {
          const lieux = (parent.props.lieux as string[] | undefined) ?? []
          if (!lieux.includes(p.id)) parent.props.lieux = [...lieux, p.id]
        }
        continue
      }
    }
    if (parent) e.parentId = parent.id
  }

  // 5. Texte : liens internes, images et fichiers joints.
  for (const e of entities) {
    const page = pageOf.get(e)
    if (!page) continue
    const source = e.type === 'regle' ? e.bodyMd : [e.bodyMd, page.body].filter(Boolean).join('\n\n')
    e.bodyMd = convertBody(source, page, `${TYPE_DEFS[e.type].label} « ${e.title} »`)
  }

  // 6. Ordre des pages enfants : celui des liens dans le texte de la page parente.
  for (const e of entities) {
    if (!e.parentId) continue
    const parentPage = pageOf.get(entities.find(x => x.id === e.parentId)!)
    const page = pageOf.get(e)
    const pos = parentPage && page ? parentPage.body.indexOf(page.notionId) : -1
    e.sortOrder = pos >= 0 ? pos : 1_000_000
  }

  // Normalisation finale, comme toute donnée lue par l'app.
  const out = entities.map(e => {
    const { entity, warnings } = normalizeEntity(e)
    for (const w of warnings) warn('Valeurs hors liste', w)
    return entity
  })
  return { entities: out, assets, media, report }

  function addAliases(e: Entity, names: string[]) {
    for (const n of names.map(s => s.replace(/\s+/g, ' ').trim())) {
      if (n && !sameKey(n, e.title) && !e.aliases.some(a => sameKey(a, n))) e.aliases.push(n)
    }
    e.aliases = e.aliases.filter(a => !sameKey(a, e.title))
  }

  function addAsset(path: string, who: string): string | null {
    const bytes = exp.files.get(path)
    if (!bytes) {
      warn('Fichiers manquants', `${who} : ${path}`)
      return null
    }
    const existing = assetOfPath.get(path)
    if (existing) return existing
    const id = newId()
    assetOfPath.set(path, id)
    const name = path.slice(path.lastIndexOf('/') + 1)
    const ext = (/\.(\w+)$/.exec(name)?.[1] ?? 'bin').toLowerCase()
    const fileName = `${id}.${ext}`
    media[fileName] = bytes
    assets.push({
      id,
      file_name: fileName,
      original_name: name,
      mime: MIME[ext] ?? 'application/octet-stream',
      size: bytes.length,
      width: null,
      height: null,
      created_at: now,
    })
    return id
  }

  function convertBody(md: string, page: Page, who: string): string {
    // [texte](cible) et ![texte](cible) ; la cible peut contenir des parenthèses (« Osmo%20(M%C3%A9rou) »).
    const LINK = /(!?)\[([^\]\n]*)\]\(((?:[^()\s]|\((?:[^()\s])*\))+)\)/g
    return md
      .replace(LINK, (all, bang: string, text: string, href: string) => {
        if (/^[a-z]+:/i.test(href)) return all
        const nid = /([0-9a-f]{32})\.md$/.exec(href)?.[1]
        if (nid) {
          const t = byNotion.get(nid)
          if (t) return wikiLink(t.id, text)
          warn('Liens cassés', `${who} : « ${text} » vers une page absente de l'export`)
          return wikiLink(MISSING, text)
        }
        if (/\.csv$/i.test(href)) return '' // vue d'une base de données : pas de fiche
        const asset = addAsset(resolvePath(page.dir, href), who)
        if (!asset) return text
        // Légende = nom du fichier (cas de l'export Notion) : remplacée par « image ».
        const caption = /\.(png|jpe?g|webp|gif|pdf)$/i.test(text) ? '' : text
        return `${bang}[${caption || (bang ? 'image' : 'fichier')}](asset:${asset})`
      })
      .replace(/^#{1,6}\s*$/gm, '')
      .replace(/^(Owner|Created|Last edited time): .*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
}

/** Avantages ou désavantages d'une classe, en toutes lettres (« Intellect ×2 »). */
function statList(keys: readonly Parameters<typeof statLabel>[0][]): string {
  const count = new Map<string, number>()
  for (const k of keys) count.set(statLabel(k), (count.get(statLabel(k)) ?? 0) + 1)
  return [...count].map(([l, n]) => (n > 1 ? `${l} ×${n}` : l)).join(', ')
}

const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Page qui ne contient que des liens vers ses propres sous-pages. */
function isIndexPage(page: Page, exp: NotionExport): boolean {
  const lines = page.body.split('\n').map(l => l.trim()).filter(Boolean)
  const hasChildren = exp.pages.some(p => p.dir === (page.dir ? `${page.dir}/${page.name}` : page.name))
  return hasChildren && lines.length > 0 && lines.every(l => /^\[[^\]]*\]\([^)]*\.md\)$/.test(l))
}

/** Règles : une fiche par titre de niveau 1 (« # 2. Caractéristiques… » → section 2). */
export function splitRules(page: Page): { title: string; section: string; body: string }[] {
  const out: { title: string; section: string; body: string[] }[] = []
  const intro: string[] = []
  for (const line of page.body.split('\n')) {
    const h = /^# (.+)$/.exec(line)
    if (h) {
      const clean = h[1].replace(/\*+/g, '').trim()
      const m = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/.exec(clean)
      out.push({ title: m ? m[2] : clean, section: m ? m[1] : '', body: [] })
    } else (out.at(-1)?.body ?? intro).push(line)
  }
  if (!out.length) return [{ title: page.title, section: '', body: page.body }]
  if (intro.join('').trim()) out[0].body.unshift(...intro, '')
  return out.map(s => ({ title: s.title, section: s.section, body: s.body.join('\n').replace(/\n{3,}/g, '\n\n').trim() }))
}
