import DOMPurify from 'dompurify'
import { Marked, type TokenizerAndRendererExtension } from 'marked'
import { MISSING } from './model/links'

// Rendu du texte des fiches (D-M3) : Markdown → HTML nettoyé. Liens `[[id|Titre]]` rendus en liens internes
// (`data-id`), liens rouges `[[?|Nom]]` ou vers une fiche disparue en `data-create` (clic = créer la fiche).

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** `exists` dit si une fiche existe (catalogue) ; une fiche inconnue donne un lien rouge. */
export function markdownToHtml(md: string, exists: (id: string) => boolean): string {
  const wikiLink: TokenizerAndRendererExtension = {
    name: 'wikiLink',
    level: 'inline',
    start: src => src.indexOf('[['),
    tokenizer(src) {
      const m = /^\[\[([^\]|\n]+)\|([^\]\n]*)\]\]/.exec(src)
      if (m) return { type: 'wikiLink', raw: m[0], id: m[1].trim(), label: m[2] }
    },
    renderer(token) {
      const { id, label } = token as unknown as { id: string; label: string }
      return id !== MISSING && exists(id)
        ? `<a href="#" class="wl" data-id="${esc(id)}">${esc(label)}</a>`
        : `<a href="#" class="wl missing" data-create="${esc(label)}" title="Fiche à créer">${esc(label)}</a>`
    },
  }
  const marked = new Marked({ gfm: true, breaks: true, extensions: [wikiLink] })
  marked.use({
    renderer: {
      // Médias (M6) : `asset:<id>` n'est pas encore résolu.
      image({ href, text }) {
        return href.startsWith('asset:') ? `<span class="asset">[image : ${esc(text || 'sans légende')}]</span>` : false
      },
    },
  })
  return marked.parse(md, { async: false })
}

export function renderMarkdown(md: string, exists: (id: string) => boolean): string {
  const html = DOMPurify.sanitize(markdownToHtml(md, exists), { ADD_ATTR: ['target'] })
  // Liens externes : hors de l'app (navigateur du Chromebook).
  return html.replace(/<a href="(https?:[^"]*)"/g, '<a href="$1" target="_blank" rel="noopener"')
}
