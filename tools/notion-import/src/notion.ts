import { strFromU8, unzipSync } from 'fflate'

// Lecture de l'export Notion « Markdown & CSV » (IMPORT_NOTION §2) : une page = un fichier `Titre <id>.md`
// (id = 32 caractères hexadécimaux), ses sous-pages et fichiers joints dans le dossier `Titre/` à côté.
// Les bases de données sont des dossiers (`Persos f97d-0b0b/`) avec un fichier .md par ligne ; les CSV ne
// servent pas (les propriétés sont aussi en tête de chaque page).

export interface Page {
  /** Chemin complet dans l'export (`One Piece/Persos f97d-0b0b/Garp 159c….md`). */
  path: string
  /** Dossier de la page (`One Piece/Persos f97d-0b0b`). */
  dir: string
  /** Nom du fichier sans l'identifiant ni l'extension : nom du dossier de ses sous-pages et fichiers. */
  name: string
  notionId: string
  title: string
  /** Propriétés en tête de page (`Race: Humains (../Races/Humains 284a….md)`), texte brut. */
  props: Record<string, string>
  /** Texte de la page, sans le titre ni les propriétés. */
  body: string
}

export interface NotionExport {
  pages: Page[]
  /** Tous les fichiers de l'export (pages comprises), par chemin. */
  files: Map<string, Uint8Array>
}

const PAGE_FILE = /^(.*) ([0-9a-f]{32})\.md$/

/** Propriétés reconnues en tête d'une page hors base de données (une ligne de texte « X: y » n'en est pas une). */
const PAGE_PROPS = new Set(['Owner', 'Created', 'Created time', 'Last edited time', 'Tags', 'Étiquettes'])

/** Ouvre l'export (zip, éventuellement zip de zips comme les gros exports Notion). */
export function readExportZip(bytes: Uint8Array): NotionExport {
  const files = new Map<string, Uint8Array>()
  const add = (zip: Uint8Array) => {
    for (const [name, data] of Object.entries(unzipSync(zip))) {
      if (name.endsWith('/')) continue
      if (name.toLowerCase().endsWith('.zip')) add(data)
      else files.set(name.replace(/\\/g, '/'), data)
    }
  }
  add(bytes)
  return readExportFiles(files)
}

export function readExportFiles(files: Map<string, Uint8Array>): NotionExport {
  const pages: Page[] = []
  const seen = new Set<string>()
  for (const [path, data] of files) {
    const slash = path.lastIndexOf('/')
    const m = PAGE_FILE.exec(path.slice(slash + 1))
    if (!m || seen.has(m[2])) continue
    seen.add(m[2])
    const dir = slash >= 0 ? path.slice(0, slash) : ''
    pages.push({ path, dir, name: m[1], notionId: m[2], ...parsePage(strFromU8(data), isDatabaseDir(dir, files)) })
  }
  pages.sort((a, b) => a.path.localeCompare(b.path))
  return { pages, files }
}

/** Dossier de base de données : un CSV du même nom (à l'identifiant raccourci près) l'accompagne. */
function isDatabaseDir(dir: string, files: Map<string, Uint8Array>): boolean {
  const slash = dir.lastIndexOf('/')
  const parent = dir.slice(0, slash + 1)
  const base = dir.slice(slash + 1).replace(/ [0-9a-f]{4}-[0-9a-f]{4}$/, '')
  for (const p of files.keys()) {
    if (!p.startsWith(parent) || !p.endsWith('.csv')) continue
    const rest = p.slice(parent.length)
    if (!rest.includes('/') && rest.startsWith(`${base} `)) return true
  }
  return false
}

export function parsePage(text: string, database: boolean): Pick<Page, 'title' | 'props' | 'body'> {
  const lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n')
  let i = 0
  let title = ''
  const h1 = /^# (.*)$/.exec(lines[0] ?? '')
  if (h1) {
    title = h1[1].trim()
    i = 1
  }
  while (i < lines.length && !lines[i].trim()) i++
  const props: Record<string, string> = {}
  for (; i < lines.length; i++) {
    const m = /^([^:\n*#>\-[]{1,40}): (.*)$/.exec(lines[i])
    if (!m || (!database && !PAGE_PROPS.has(m[1].trim()))) break
    props[m[1].trim()] = m[2].trim()
  }
  return { title, props, body: lines.slice(i).join('\n').trim() }
}

/** Identifiants Notion des pages citées dans une valeur de propriété (relations). */
export function relatedIds(value: string | undefined): string[] {
  return [...(value ?? '').matchAll(/([0-9a-f]{32})\.md\)/g)].map(m => m[1])
}

/**
 * Valeurs d'une propriété « liste » (`Étiquettes: PNJ, Marine`). Les relations (`Nom (chemin.md)`) donnent
 * leur nom.
 */
export function listValues(value: string | undefined): string[] {
  const v = (value ?? '').replace(/ \((?:[^()]|\([^()]*\))*\.(?:md|csv)\)/g, '')
  return v
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

/** Résout un chemin relatif (encodé comme dans l'export) depuis le dossier d'une page. */
export function resolvePath(dir: string, href: string): string {
  let rel: string
  try {
    rel = decodeURIComponent(href)
  } catch {
    rel = href
  }
  const parts = dir ? dir.split('/') : []
  for (const p of rel.split('/')) {
    if (p === '..') parts.pop()
    else if (p && p !== '.') parts.push(p)
  }
  return parts.join('/')
}
