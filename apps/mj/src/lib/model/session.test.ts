import { describe, expect, it } from 'vitest'
import {
  createSession,
  dayLabel,
  nextNumber,
  normalizeSession,
  parseSessionNoteTitle,
  planImportedNotes,
  sessionIdOfTab,
  sessionLabel,
  sessionRow,
  sessionTab,
} from './session'

describe('sessions', () => {
  it('création, numéro suivant, libellé, onglet', () => {
    const s = createSession('c1', 4)
    expect(s).toMatchObject({ campaignId: 'c1', number: 4, status: 'prevue', pinnedIds: [], playedOn: null })
    expect(nextNumber([])).toBe(1)
    expect(nextNumber([{ number: 2 }, { number: 7 }])).toBe(8)
    expect(sessionLabel({ number: 4, title: '' })).toBe('Session 4')
    expect(sessionLabel({ number: 4, title: " L'île du Sud " })).toBe("Session 4 — L'île du Sud")
    expect(sessionIdOfTab(sessionTab('abc'))).toBe('abc')
    expect(sessionIdOfTab('abc')).toBeNull()
    expect(dayLabel('2025-02-22')).toBe('22 février 2025')
  })

  it('aller-retour en ligne SQL ; relecture prudente', () => {
    const s = { ...createSession('c1', 3), title: 'Retour', playedOn: '2025-04-30', pinnedIds: ['a', 'b'], status: 'terminee' as const }
    expect(normalizeSession(sessionRow(s))).toEqual(s)
    expect(normalizeSession({ id: 'x', campaign_id: 'c', number: -2, status: 'bizarre', pinned_ids: 'pas du json', played_on: '22/02/25' })).toMatchObject({
      number: 1,
      status: 'prevue',
      pinnedIds: [],
      playedOn: null,
    })
    expect(normalizeSession({ id: 'x' })).toBeNull()
  })

  it('titre d’une note de session importée', () => {
    expect(parseSessionNoteTitle('Session 1 (22/02/25) — Note de session')).toEqual({ number: 1, playedOn: '2025-02-22', label: 'Note de session' })
    expect(parseSessionNoteTitle('Session 3 (30/04/2025) — Note de session')?.playedOn).toBe('2025-04-30')
    expect(parseSessionNoteTitle('Session 2 — Idée pour la suite')).toEqual({ number: 2, playedOn: null, label: 'Idée pour la suite' })
    expect(parseSessionNoteTitle('Idée pour la suite')).toBeNull()
  })

  it('reprise des notes : résumé de la session N, autre note → préparation de N+1 (D-M26)', () => {
    const plan = planImportedNotes([
      { id: 'n2', title: 'Session 2 (21/04/25) — Note de session', bodyMd: 'Rébellion.' },
      { id: 'i2', title: 'Session 2 (21/04/25) — Idée pour la suite', bodyMd: 'Meliana demande de l’aide.' },
      { id: 'n1', title: 'Session 1 (22/02/25) — Note de session', bodyMd: 'Rencontre.' },
      { id: 'x', title: 'Autre note', bodyMd: '…' },
    ])
    expect(plan.noteIds.sort()).toEqual(['i2', 'n1', 'n2'])
    expect(plan.sessions).toEqual([
      { number: 1, playedOn: '2025-02-22', summaryMd: 'Rencontre.', prepMd: '', done: true },
      { number: 2, playedOn: '2025-04-21', summaryMd: 'Rébellion.', prepMd: '', done: true },
      { number: 3, playedOn: null, summaryMd: '', prepMd: '## Idée pour la suite\n\nMeliana demande de l’aide.', done: false },
    ])
  })
})
