import { describe, expect, it } from 'vitest'
import { handleBack, onBack } from './back'

describe('bouton retour', () => {
  it("exécute l'action la plus récente, puis les précédentes", () => {
    const calls: string[] = []
    const offList = onBack(() => calls.push('liste'))
    const offSheet = onBack(() => calls.push('fenêtre'))
    expect(handleBack()).toBe(true)
    offSheet()
    expect(handleBack()).toBe(true)
    offList()
    expect(handleBack()).toBe(false)
    expect(calls).toEqual(['fenêtre', 'liste'])
  })
})
