/**
 * EG7/EG8: Snabb-CV:s lager-/förargren och jämförelsen mot mallens egen text.
 */
import { describe, it, expect } from 'vitest'
import { generateQuickSummary, generateQuickSkills, arOredigeradSnabbmall } from './quickCvTexter'

describe('EG7: lager/truck/chaufför har en egen gren', () => {
  it.each(['Lagerarbetare', 'Truckförare', 'Lastbilschaufför', 'Lagerchef'])('%s får lagertext, inte standardtexten', (titel) => {
    const text = generateQuickSummary(titel)
    expect(text).toMatch(/lager och logistik/)
    expect(text).not.toMatch(/^Motiverad /)
  })

  it('påstår inga meriter (truckkort, år, certifikat)', () => {
    const text = generateQuickSummary('Truckförare')
    expect(text).not.toMatch(/truckkort|certifikat|\d+ år|års erfarenhet|erfarenhet av/i)
  })

  it('kompetenserna innehåller lager och logistik utöver de mjuka grundkompetenserna', () => {
    const namn = generateQuickSkills('Lagerarbetare')!.map(s => s.name)
    expect(namn).toContain('Lager och logistik')
    expect(namn).toContain('Kommunikation')
  })

  it('övriga grenar är oförändrade', () => {
    expect(generateQuickSummary('Utvecklare')).toMatch(/^Engagerad utvecklare/)
    expect(generateQuickSummary('Kock')).toBe('Motiverad kock som söker nya utmaningar. Bidrar med engagemang, pålitlighet och vilja att utvecklas i min roll.')
  })
})

describe('EG8: arOredigeradSnabbmall', () => {
  it('känner igen mallens text, även efter en databasrundtur som ordnar om nycklar och byter id', () => {
    const skills = generateQuickSkills('Lagerarbetare')!.map((s, i) => ({ category: s.category, level: s.level, name: s.name, id: `ny-${i}` }))
    const r = arOredigeradSnabbmall({ title: 'Lagerarbetare', summary: generateQuickSummary('Lagerarbetare'), skills })
    expect(r).toEqual({ profil: true, kompetenser: true })
  })

  it('tystnar när användaren ändrat texten eller kompetenserna', () => {
    const skills = [...generateQuickSkills('Lagerarbetare')!, { id: 'z', name: 'Truck A/B', level: 4, category: 'technical' as const }]
    const r = arOredigeradSnabbmall({ title: 'Lagerarbetare', summary: generateQuickSummary('Lagerarbetare') + ' Egen mening.', skills })
    expect(r).toEqual({ profil: false, kompetenser: false })
  })

  it('tystnar utan titel eller utan kompetenser', () => {
    expect(arOredigeradSnabbmall({ title: '', summary: '', skills: [] })).toEqual({ profil: false, kompetenser: false })
  })
})
