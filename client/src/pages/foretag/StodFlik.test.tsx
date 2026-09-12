/**
 * StodFlik — den företagsvända stödsidan får ALDRIG visa belopp, procent
 * eller kronbelopp (CLAUDE.md: hitta aldrig på en siffra som är en regel;
 * uppdraget: "ta bara fält som är text"). Grinden läser hela den renderade
 * texten, inte bara de fält vi tror vi renderar — så en ny post i
 * data/anstallningsstod.ts som bär "N kr" i sammanfattningen fäller testet.
 */
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { rendera } from './__tests__/rendera'
import { ANSTALLNINGSSTOD } from '@/data/anstallningsstod'
import { utanBelopp, byggStodKort } from '@/components/foretag/stodKort'
import { StodFlik } from './StodFlik'

describe('StodFlik', () => {
  it('renderar stödformerna med namn, AF-raden och länk till Arbetsförmedlingen', () => {
    const { container } = rendera(<StodFlik />, '/foretag/stod')
    expect(screen.getByText('Beslut om stöd fattas av Arbetsförmedlingen. Er konsulent hjälper er med ansökan.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nystartsjobb' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /SIUS/ })).toBeInTheDocument()
    const lankar = screen.getAllByRole('link', { name: /Läs mer hos Arbetsförmedlingen/ })
    expect(lankar.length).toBe(byggStodKort(ANSTALLNINGSSTOD).length)
    for (const l of lankar) {
      expect(l).toHaveAttribute('href', expect.stringMatching(/^https:\/\/arbetsformedlingen\.se\//))
      expect(l).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(container.textContent).toContain('Vad som krävs av er')
  })

  it('visar aldrig belopp, procent eller kronbelopp — i hela den renderade texten', () => {
    const { container } = rendera(<StodFlik />, '/foretag/stod')
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\d[\d\s.,]*\s*(kr|kronor|%|procent)/i)
    expect(text).not.toMatch(/20\s?000/)
    expect(text).not.toMatch(/80\s?procent/i)
    expect(text).not.toMatch(/30–50/)
  })

  it('utanBelopp fäller belopp och procent men inte åldrar eller månader', () => {
    expect(utanBelopp('lönetak 20 000 kr per månad')).toBe(false)
    expect(utanBelopp('80 procent av lönekostnaden')).toBe(false)
    expect(utanBelopp('högst 80 % av bruttokostnaden')).toBe(false)
    expect(utanBelopp('skatteskuld över 10 000 kr')).toBe(false)
    expect(utanBelopp('20–24 år, arbetslös minst 6 av de senaste 9 månaderna')).toBe(true)
    expect(utanBelopp('Upp till 12 månader')).toBe(true)
  })

  it('byggStodKort läser aldrig belopp/vadArbetsgivarenFar/konsulentErfarenhet', () => {
    const kort = byggStodKort(ANSTALLNINGSSTOD)
    for (const k of kort) {
      expect(k).not.toHaveProperty('belopp')
      expect(k).not.toHaveProperty('vadArbetsgivarenFar')
      expect(k).not.toHaveProperty('konsulentErfarenhet')
      for (const rad of [k.kort, k.langd ?? '', k.ansokan ?? '', ...k.kravPaEr]) expect(utanBelopp(rad)).toBe(true)
    }
  })
})
