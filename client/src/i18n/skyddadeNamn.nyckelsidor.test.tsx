/**
 * FN19, resten: myndighetsnamnen på nyckelsidor utanför artiklarna ska vara
 * `translate="no"` (annars översätter Google Översätt bort "Arbetsförmedlingen"
 * för den som läser på arabiska, somaliska eller tigrinja). Vaktar att varje
 * textnod med ett skyddat namn på Internationellt-flikarna och i rådgivarens
 * dialogruta ligger inuti ett skyddat element — och att skyddet aldrig hamnar
 * i ett attribut.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { skyddadeNamnRegex } from './skyddadeNamn'

const hamtaMock = vi.fn(async () => ({ items: {}, lastUpdated: '' }))
vi.mock('@/services/cloudStorage', () => ({
  integrationChecklistApi: {
    getProgress: () => hamtaMock(),
    saveProgress: async () => true,
  },
}))

import ValideringTab from '@/pages/international/ValideringTab'
import IntegrationTab from '@/pages/international/IntegrationTab'
import CrisisSupport from '@/components/CrisisSupport'
import { Dialogruta } from '@/components/varld/Dialogruta'

/** Textnoder med ett skyddat namn som INTE ligger under translate="no". */
function oskyddade(root: HTMLElement): string[] {
  const ut: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let n: Node | null
  while ((n = walker.nextNode())) {
    const text = n.textContent ?? ''
    if (skyddadeNamnRegex().test(text) && !(n.parentElement?.closest('[translate="no"]'))) {
      ut.push(text.trim().slice(0, 60))
    }
  }
  return ut
}

function attributMedSpan(root: HTMLElement): string[] {
  return [...root.querySelectorAll('*')]
    .flatMap((el) => [...el.attributes].map((a) => a.value))
    .filter((v) => v.includes('translate='))
}

beforeEach(() => {
  hamtaMock.mockReset()
  hamtaMock.mockResolvedValue({ items: {}, lastUpdated: '' })
})

describe('FN19 — myndighetsnamn på nyckelsidor', () => {
  it('Internationellt, validering och legitimation', () => {
    const { container } = render(<MemoryRouter><ValideringTab /></MemoryRouter>)
    expect(container.querySelectorAll('[translate="no"]').length).toBeGreaterThan(0)
    expect(oskyddade(container)).toEqual([])
    expect(attributMedSpan(container)).toEqual([])
  })

  it('Internationellt, ny i Sverige', () => {
    const { container } = render(<MemoryRouter><IntegrationTab /></MemoryRouter>)
    expect(container.querySelectorAll('[translate="no"]').length).toBeGreaterThan(0)
    expect(oskyddade(container)).toEqual([])
    expect(attributMedSpan(container)).toEqual([])
  })

  it('rådgivarens dialogruta', () => {
    const { container } = render(
      <MemoryRouter>
        <Dialogruta
          coachId="jobbcoach"
          repliker={[{
            nyckel: 'test-skydd',
            text: 'Här finns länkar till Arbetsförmedlingen och Försäkringskassan.',
            knapp: null,
          }]}
        />
      </MemoryRouter>,
    )
    expect(container.querySelectorAll('[translate="no"].notranslate').length).toBeGreaterThanOrEqual(2)
    expect(oskyddade(container)).toEqual([])
  })

  it('krisstödet (Jourhavande medmänniska)', () => {
    render(<CrisisSupport variant="inline" />)
    // Panelen portalas till body och öppnas med knappen.
    fireEvent.click(document.querySelector('button[aria-expanded]') as HTMLElement)
    const skyddade = [...document.body.querySelectorAll('[translate="no"].notranslate')].map((e) => e.textContent)
    expect(skyddade).toContain('Jourhavande medmänniska')
    expect(oskyddade(document.body)).toEqual([])
  })
})
