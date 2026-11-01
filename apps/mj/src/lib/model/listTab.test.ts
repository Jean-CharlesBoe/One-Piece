import { describe, expect, it } from 'vitest'
import { isListTab, listLabel, listModeOfTab, listTab } from './listTab'

describe('onglets de liste (D-M27)', () => {
  it('aller-retour, modes inconnus refusés', () => {
    expect(listModeOfTab(listTab('personnage'))).toBe('personnage')
    expect(listModeOfTab(listTab('archives'))).toBe('archives')
    expect(listModeOfTab('liste:inconnu')).toBeNull()
    expect(listModeOfTab('abc-123')).toBeNull()
    expect(isListTab('liste:lieu')).toBe(true)
  })

  it('titre et icône', () => {
    expect(listLabel('personnage')).toEqual({ title: 'Personnages', icon: '👤' })
    expect(listLabel('doublons').title).toBe('Doublons probables')
  })
})
