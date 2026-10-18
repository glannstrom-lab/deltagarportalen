import { describe, it, expect } from 'vitest'
import { analyseraTal } from './talLeverans'

describe('O10 steg 1: leveransen räknad ur talet', () => {
  it('ord, tid och ord per minut', () => {
    const text = 'Jag har jobbat på lager i fem år och trivs med att ha ordning på saker'
    const a = analyseraTal(text, 6)
    expect(a).toMatchObject({ ord: 16, sekunder: 6, ordPerMinut: 160 })
  })

  it('utfyllnadsord räknas med ordgränser — "typ av" och ord som innehåller dem räknas inte', () => {
    const text = 'Alltså jag har liksom jobbat typ tre år, vilken typ av jobb som helst, liksom. Kapitalliksomt är inget ord.'
    const a = analyseraTal(text, 20)!
    expect(a.utfyllnad).toEqual([
      { ord: 'liksom', antal: 2 },
      { ord: 'alltså', antal: 1 },
      { ord: 'typ', antal: 1 },
    ])
  })

  it('eh och öh räknas om taligenkänningen tog med dem', () => {
    const a = analyseraTal('eh jag öhm vet inte riktigt eeh vad jag ska säga', 10)!
    expect(a.utfyllnad).toEqual(expect.arrayContaining([{ ord: 'eh', antal: 2 }, { ord: 'öh', antal: 1 }]))
  })

  it('för lite underlag ger inget resultat, inte en nolla', () => {
    expect(analyseraTal('Ja precis', 30)).toBeNull()
    expect(analyseraTal('Jag har jobbat på lager i fem år', 3)).toBeNull()
  })
})
