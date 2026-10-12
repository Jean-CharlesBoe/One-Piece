import { describe, expect, it } from 'vitest'
import { clampView, coverScale, initialView, MAX_ZOOM, pan, sourceRect, zoomAt } from './crop'

const W = 800, H = 600, F = 300

describe('recadrage', () => {
  it('démarre centré, image couvrant le cadre', () => {
    const v = initialView(W, H, F)
    expect(v.s).toBe(0.5) // 600 px de haut → 300 px
    expect(v).toMatchObject({ x: -50, y: 0 })
    expect(sourceRect(v, F)).toEqual({ sx: 100, sy: 0, side: 600 })
  })

  it('ne laisse jamais de bord vide en déplaçant', () => {
    const v = initialView(W, H, F)
    expect(pan(v, 500, 0, W, H, F).x).toBe(0) // bord gauche de l'image collé au cadre
    expect(pan(v, -500, 0, W, H, F).x).toBe(F - W * v.s) // bord droit
    expect(pan(v, 0, 40, W, H, F).y).toBe(0) // pas de marge verticale possible
  })

  it('borne le zoom entre « couvre le cadre » et ×5', () => {
    const v = initialView(W, H, F)
    expect(clampView({ ...v, s: 0.1 }, W, H, F).s).toBe(coverScale(W, H, F))
    expect(clampView({ ...v, s: 99 }, W, H, F).s).toBe(coverScale(W, H, F) * MAX_ZOOM)
  })

  it('zoome en gardant fixe le point visé', () => {
    const v = initialView(W, H, F)
    const z = zoomAt(v, 1, 150, 150, W, H, F)
    // le point d'image au centre du cadre reste au centre
    const before = { ix: (150 - v.x) / v.s, iy: (150 - v.y) / v.s }
    const after = { ix: (150 - z.x) / z.s, iy: (150 - z.y) / z.s }
    expect(after.ix).toBeCloseTo(before.ix)
    expect(after.iy).toBeCloseTo(before.iy)
    expect(sourceRect(z, F).side).toBe(300)
  })
})
