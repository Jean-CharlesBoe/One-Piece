import { createAsset, isImage, mimeOf, type Asset } from './model/asset'
import { getMedia, mediaChanged, putMedia } from './storage/media'
import { getRepository } from './storage/repository'

// Médias de l'appli MJ (M6) : import d'un fichier, lecture, adresse d'affichage, téléchargement.
// La description est en base (table assets) ; le fichier dans le stockage de l'appareil (storage/media.ts).

class Media {
  byId = $state.raw(new Map<string, Asset>())
  /** Change quand un fichier arrive sur l'appareil (import, reprise depuis le dossier) : réafficher. */
  version = $state(0)
  /** Média affiché en plein écran (visionneuse), ou `null`. */
  viewing = $state<string | null>(null)
  #urls = new Map<string, string>()

  constructor() {
    mediaChanged.addEventListener('change', () => this.version++)
  }

  async load(): Promise<void> {
    const list = await (await getRepository()).listAssets()
    this.byId = new Map(list.map(a => [a.id, a]))
  }

  /** Importe un fichier choisi (image ou PDF) ; lève une erreur lisible s'il n'est pas accepté. */
  async importFile(file: File): Promise<Asset> {
    const mime = mimeOf(file)
    if (!mime) throw new Error(`« ${file.name} » : seuls les PDF et les images (JPG, PNG, WebP, GIF) sont acceptés.`)
    let dims: { width: number; height: number } | null = null
    if (mime.startsWith('image/')) {
      try {
        const bmp = await createImageBitmap(file)
        dims = { width: bmp.width, height: bmp.height }
        bmp.close()
      } catch {
        throw new Error(`« ${file.name} » : image illisible.`)
      }
    }
    const asset = createAsset(file, mime, dims)
    await putMedia(asset.fileName, new Blob([file], { type: mime }))
    await (await getRepository()).saveAsset(asset)
    this.byId = new Map(this.byId).set(asset.id, asset)
    return asset
  }

  async blob(id: string): Promise<Blob | null> {
    const a = this.byId.get(id)
    if (!a) return null
    const b = await getMedia(a.fileName)
    return b && (b.type ? b : new Blob([b], { type: a.mime }))
  }

  /** Adresse locale (blob:) pour afficher le fichier ; `null` s'il n'est pas (encore) sur l'appareil. */
  async url(id: string): Promise<string | null> {
    const known = this.#urls.get(id)
    if (known) return known
    const b = await this.blob(id)
    if (!b) return null
    const u = URL.createObjectURL(b)
    this.#urls.set(id, u)
    return u
  }

  /** Ressort le fichier tel quel (D-M16) : téléchargé sous son nom d'origine. */
  async download(id: string): Promise<boolean> {
    const a = this.byId.get(id)
    const u = await this.url(id)
    if (!a || !u) return false
    const link = document.createElement('a')
    link.href = u
    link.download = a.originalName
    link.click()
    return true
  }

  isImage(id: string): boolean {
    const a = this.byId.get(id)
    return !!a && isImage(a)
  }
}

export const media = new Media()
