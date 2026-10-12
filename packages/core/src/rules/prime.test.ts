import { describe, expect, it } from 'vitest'
import { STAT_KEYS } from '../model/stats'
import { MEMO_CARACS, MEMO_RESSOURCES, STAT_DESCRIPTIONS } from './memos'
import { formatPrime, parsePrime, setPrime } from './prime'

describe('prime', () => {
  it('lit les saisies avec séparateurs, refuse le reste', () => {
    expect(parsePrime('30 000 000')).toBe(30_000_000)
    expect(parsePrime('1.500.000')).toBe(1_500_000)
    expect(parsePrime(' 120 ')).toBe(120)
    expect(parsePrime('')).toBeNull()
    expect(parsePrime('-5')).toBeNull()
    expect(parsePrime('trois')).toBeNull()
  })

  it('reste positive et bornée ; null = pas de prime', () => {
    const c = { prime: null as number | null }
    expect(setPrime(c, 3_000_000_000)).toBe(3_000_000_000)
    expect(setPrime(c, -1)).toBe(0)
    expect(setPrime(c, 1e15)).toBe(99_999_999_999)
    expect(setPrime(c, null)).toBeNull()
  })

  it('s’affiche en berries avec les séparateurs français', () => {
    expect(formatPrime(30_000_000).replace(/\s/g, ' ')).toBe('30 000 000 ฿')
  })
})

describe('mémo des caractéristiques', () => {
  it('décrit les 8 caracs et la règle des avantages', () => {
    expect(Object.keys(STAT_DESCRIPTIONS).sort()).toEqual([...STAT_KEYS].sort())
    expect(MEMO_CARACS.liste).toHaveLength(8)
    expect(MEMO_CARACS.texte.join(' ')).toMatch(/relances/)
  })
})

describe('mémo des ressources', () => {
  it('couvre les ressources et le transfert', () => {
    const labels = MEMO_RESSOURCES.liste!.map(([l]) => l)
    expect(labels).toEqual(expect.arrayContaining(['Vitalité', 'Endurance', 'Rêve', 'Ambition', 'Transfert']))
    expect(MEMO_RESSOURCES.liste!.find(([l]) => l === 'Ambition')![1]).toMatch(/ajoute 2 au résultat/)
  })
})
