import { describe, it, expect } from 'vitest'
import { buildCvAdaptUrl, buildCoverLetterUrl } from './jobLinks'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

const job = {
  id: '123',
  headline: 'Lagerarbetare & truckförare',
  employer: { name: 'Nordfrakt AB' },
  description: { text: 'Vi söker dig med truckkort. ' + 'x'.repeat(5000) },
} as unknown as PlatsbankenJob

describe('O9: länken från en annons till CV-anpassningen', () => {
  it('bär titel, arbetsgivare och annonstext till /cv/adapt', () => {
    const url = buildCvAdaptUrl(job)
    expect(url.startsWith('/cv/adapt?')).toBe(true)
    const p = new URLSearchParams(url.split('?')[1])
    expect(p.get('title')).toBe('Lagerarbetare & truckförare')
    expect(p.get('company')).toBe('Nordfrakt AB')
    expect(p.get('desc')?.startsWith('Vi söker dig med truckkort.')).toBe(true)
  })

  it('kortar annonstexten till 3 000 tecken — mer än brevets 500, för att jämförelsen bygger på fritexten', () => {
    const p = new URLSearchParams(buildCvAdaptUrl(job).split('?')[1])
    expect(p.get('desc')).toHaveLength(3000)
    const brev = new URLSearchParams(buildCoverLetterUrl(job).split('?')[1])
    expect(brev.get('desc')).toHaveLength(500)
  })
})
