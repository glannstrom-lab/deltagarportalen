import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ArticleContent } from './ArticleContent'

const visa = () =>
  render(
    <ArticleContent content={'Ring **Arbetsförmedlingen** eller [CSN](https://www.csn.se) om a-kassan.\n\nKod: `CSN`'} />
  ).container

describe('ArticleContent skyddar myndighetsnamn mot översättning (FN19)', () => {
  it('markerar namn i löptext, fetstil, länktext och böjning', () => {
    const nej = Array.from(visa().querySelectorAll('[translate="no"]')).map((e) => e.textContent)
    expect(nej).toEqual(['Arbetsförmedlingen', 'CSN', 'a-kassan'])
  })
  it('rör inte href eller kod', () => {
    const c = visa()
    expect(c.querySelector('a[href^="https"]')?.getAttribute('href')).toBe('https://www.csn.se')
    expect(c.querySelector('code')?.querySelector('[translate]')).toBeNull()
  })
})
