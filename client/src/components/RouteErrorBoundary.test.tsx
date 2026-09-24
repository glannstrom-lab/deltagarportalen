/**
 * Felgränsen för rutter ska följa språket — och får inte själv krascha om
 * i18next gör det.
 *
 * Prod-svepet 2026-09-24: rubrik, text och knappar var hårdkodad svenska,
 * också i engelskt läge.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { RouteErrorBoundary, tFel } from './RouteErrorBoundary'

const NYA_EN = {
  routeError: {
    generalTitle: 'Something went wrong',
    generalBody: 'An unexpected error happened. You can reload the page or go back to the start page.',
    retry: 'Try again',
    reload: 'Reload the page',
    home: 'Go to the start page',
    attempt: 'Attempt {{n}} of {{max}}',
    supportLead: 'If the problem continues,',
    supportLink: 'contact support',
  },
}

function Kraschar(): never {
  throw new Error('trasig komponent')
}

const visa = () =>
  render(
    <MemoryRouter>
      <RouteErrorBoundary>
        <Kraschar />
      </RouteErrorBoundary>
    </MemoryRouter>
  )

describe('RouteErrorBoundary — språk', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('sv')
  })

  it('visar svenska på svenska', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    visa()
    expect(screen.getByText('Något gick fel')).toBeInTheDocument()
    expect(screen.getByText('Till startsidan')).toBeInTheDocument()
  })

  it('visar engelska på engelska', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    i18n.addResourceBundle('en', 'translation', en, true, true)
    i18n.addResourceBundle('en', 'translation', NYA_EN, true, true)
    await i18n.changeLanguage('en')
    const vy = visa()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Go to the start page')).toBeInTheDocument()
    expect(screen.getByText('contact support')).toBeInTheDocument()
    expect(vy.container.textContent).not.toMatch(/Något gick fel|Till startsidan|kontakta support|oväntat fel/)
  })

  it('faller tillbaka på svenskan när i18next kastar — felvyn kraschar inte själv', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(i18n, 't').mockImplementation(() => {
      throw new Error('i18n trasig')
    })
    visa()
    expect(screen.getByText('Något gick fel')).toBeInTheDocument()
    expect(screen.getByText('Till startsidan')).toBeInTheDocument()
  })

  it('tFel interpolerar också i reservtexten', () => {
    vi.spyOn(i18n, 't').mockImplementation(() => {
      throw new Error('i18n trasig')
    })
    expect(tFel('routeError.attempt', 'Försök {{n}} av {{max}}', { n: 1, max: 2 })).toBe('Försök 1 av 2')
  })
})
