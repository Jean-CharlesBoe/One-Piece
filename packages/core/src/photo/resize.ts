import type { Photo } from '../model/photo'

const IMAGE_SIZE = 512
const MINI_SIZE = 96

/**
 * Charge une image depuis un fichier choisi (appareil photo / galerie) ou une data URL (photo existante).
 * L'orientation EXIF des photos de téléphone est appliquée par le navigateur.
 * L'image reste affichable (adresse `blob:`) jusqu'à `releaseImage`.
 */
export function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      releaseImage(img)
      reject(new Error("Ce fichier n'est pas une image lisible."))
    }
    img.src = typeof source === 'string' ? source : URL.createObjectURL(source)
  })
}

/** Libère la mémoire d'une image chargée depuis un fichier. */
export function releaseImage(img: HTMLImageElement | null): void {
  if (img?.src.startsWith('blob:')) URL.revokeObjectURL(img.src)
}

function squareJpeg(img: HTMLImageElement, sx: number, sy: number, side: number, size: number, quality: number): string {
  const out = Math.max(1, Math.round(Math.min(size, side)))
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = out
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Impossible de traiter l'image.")
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out)
  return canvas.toDataURL('image/jpeg', quality)
}

/** Zone carrée choisie au recadrage → image 512 px (~50–80 Ko) + miniature 96 px. */
export function cropToPhoto(img: HTMLImageElement, rect: { sx: number; sy: number; side: number }): Photo {
  return {
    image: squareJpeg(img, rect.sx, rect.sy, rect.side, IMAGE_SIZE, 0.85),
    miniature: squareJpeg(img, rect.sx, rect.sy, rect.side, MINI_SIZE, 0.8),
  }
}
