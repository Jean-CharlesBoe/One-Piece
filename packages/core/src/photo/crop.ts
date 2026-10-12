// Géométrie du recadrage : une image de w × h px affichée dans un cadre carré de F px.
// `x`, `y` : position du coin haut-gauche de l'image dans le cadre ; `s` : échelle (px écran par px image).

export interface View {
  x: number
  y: number
  s: number
}

export const MAX_ZOOM = 5

/** Échelle minimale : l'image couvre tout le cadre. */
export function coverScale(w: number, h: number, F: number): number {
  return Math.max(F / w, F / h)
}

/** Ramène la vue dans les limites : zoom entre « couvre le cadre » et ×5, aucun bord vide visible. */
export function clampView(v: View, w: number, h: number, F: number): View {
  const min = coverScale(w, h, F)
  const s = Math.min(min * MAX_ZOOM, Math.max(min, v.s))
  const clamp = (val: number, size: number) => Math.min(0, Math.max(F - size * s, val))
  return { s, x: clamp(v.x, w), y: clamp(v.y, h) }
}

/** Vue de départ : image centrée, juste assez grande pour couvrir le cadre. */
export function initialView(w: number, h: number, F: number): View {
  const s = coverScale(w, h, F)
  return { s, x: (F - w * s) / 2, y: (F - h * s) / 2 }
}

/** Zoome en gardant fixe le point du cadre (px, py) — sous les doigts ou au centre. */
export function zoomAt(v: View, s: number, px: number, py: number, w: number, h: number, F: number): View {
  const ix = (px - v.x) / v.s
  const iy = (py - v.y) / v.s
  return clampView({ s, x: px - ix * s, y: py - iy * s }, w, h, F)
}

export function pan(v: View, dx: number, dy: number, w: number, h: number, F: number): View {
  return clampView({ s: v.s, x: v.x + dx, y: v.y + dy }, w, h, F)
}

/** Partie de l'image d'origine visible dans le cadre (carré, en px image). */
export function sourceRect(v: View, F: number): { sx: number; sy: number; side: number } {
  return { sx: (0 - v.x) / v.s + 0, sy: (0 - v.y) / v.s + 0, side: F / v.s }
}
