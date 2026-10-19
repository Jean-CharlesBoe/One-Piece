import { describe, expect, it } from 'vitest'
import { emptyBackupData, makeManifest, packBackup, readBackup } from '../backup/format'
import { assetRow, createAsset, mimeOf, missingFiles, normalizeAsset, sizeLabel, titleFromFileName } from './asset'

describe('médias', () => {
  it('type d’un fichier : celui du navigateur, sinon l’extension ; refus des autres', () => {
    expect(mimeOf({ name: 'carte.png', type: 'image/png' })).toBe('image/png')
    expect(mimeOf({ name: 'Fiche.PDF', type: '' })).toBe('application/pdf')
    expect(mimeOf({ name: 'photo.jpeg', type: 'application/octet-stream' })).toBe('image/jpeg')
    expect(mimeOf({ name: 'notes.docx', type: 'application/msword' })).toBeNull()
  })

  it('nouveau média, titre de la fiche Document, taille lisible', () => {
    const a = createAsset({ name: '23_Fiche.pdf', size: 1500 }, 'application/pdf')
    expect(a.fileName).toBe(`${a.id}.pdf`)
    expect(a).toMatchObject({ originalName: '23_Fiche.pdf', mime: 'application/pdf', size: 1500, width: null })
    expect(titleFromFileName('23_Fiche_perso.pdf')).toBe('23 Fiche perso')
    expect(titleFromFileName('.png')).toBe('Document')
    expect(sizeLabel(900)).toBe('900 o')
    expect(sizeLabel(2048)).toBe('2 Ko')
    expect(sizeLabel(1572864)).toBe('1,5 Mo')
  })

  it('relecture prudente d’une ligne assets (aller-retour, valeurs manquantes, nom dangereux)', () => {
    const a = createAsset({ name: 'carte.webp', size: 10 }, 'image/webp', { width: 640, height: 480 })
    expect(normalizeAsset(assetRow(a))).toEqual(a)
    expect(normalizeAsset({ id: 'x', file_name: 'x.png' })).toMatchObject({ mime: 'image/png', originalName: 'x.png', size: 0 })
    expect(normalizeAsset({ id: 'x', file_name: '../x.png' })).toBeNull()
    expect(normalizeAsset({ file_name: 'x.png' })).toBeNull()
  })

  it('fichiers manquants', () => {
    const a = createAsset({ name: 'a.png', size: 1 }, 'image/png')
    const b = createAsset({ name: 'b.pdf', size: 1 }, 'application/pdf')
    expect(missingFiles([a, b], new Set([a.fileName]))).toEqual([b])
  })

  it('fichier .opmj avec médias : relus à part, la base n’en contient que la description', () => {
    const a = createAsset({ name: 'a.png', size: 3 }, 'image/png')
    const data = { ...emptyBackupData(), assets: [assetRow(a)] }
    const bytes = packBackup(makeManifest(data, { lastChangeAt: null, appVersion: 't', device: 't' }), data, {
      [a.fileName]: new Uint8Array([1, 2, 3]),
    })
    const back = readBackup(bytes)
    expect(back.media).toEqual({ [a.fileName]: new Uint8Array([1, 2, 3]) })
    expect(back.data.assets.map(normalizeAsset)).toEqual([a])
    // Sauvegarde du dossier : pas de fichiers.
    expect(readBackup(packBackup(makeManifest(data, { lastChangeAt: null, appVersion: 't', device: 't' }), data)).media).toEqual({})
  })
})
