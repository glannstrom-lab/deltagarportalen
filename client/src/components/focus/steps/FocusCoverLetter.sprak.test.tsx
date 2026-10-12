/**
 * Fokusguidens mallsteg (passet 2026-10-12): "Kort & Koncis", "Professionell och
 * balanserad" m.fl. var hårdkodad svenska i engelskt läge, och den tomma
 * brevikonen hade dark:text-stone-600 (för låg kontrast mot mörk bakgrund).
 *
 * Mutationer:
 *  · byt `t(template.nameKey, template.name)` mot `template.name` → "engelska" faller
 *  · sätt tillbaka dark:text-stone-600 på ikonen → källgrinden faller
 *
 * De engelska nycklarna läggs in här som fixtur tills huvudagenten fyllt på en.json.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'

vi.mock('@/services/coverLetterApi', () => ({ coverLetterApi: { create: vi.fn() } }))
vi.mock('@/services/userApi', () => ({ userApi: { getPreferences: vi.fn().mockResolvedValue(null) } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ profile: { first_name: 'Anna', last_name: 'Ek' } }) }))
vi.mock('@/hooks/useAnvandarnyckel', () => ({ useAnvandarnyckel: () => (k: unknown[]) => ['u1', ...k] }))
vi.mock('@/components/Toast', () => ({ showToast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

import { FocusCoverLetter } from './FocusCoverLetter'

const NYA_EN = {
  focusGuide: { letter: { templates: {
    standard: { name: 'Standard', description: 'Professional and balanced' },
    short: { name: 'Short and clear', description: 'Max 150 words, straight to the point' },
    formal: { name: 'Formal', description: 'Traditional tone' },
  } } },
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

function tillMallsteget() {
  const ut = render(<FocusCoverLetter onComplete={vi.fn()} onSkip={vi.fn()} onBack={vi.fn()} />, { wrapper })
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Lagerarbetare' } })
  fireEvent.click(screen.getByRole('button', { name: /Nästa|Next/ }))
  return ut
}

describe('FocusCoverLetter — mallsteget', () => {
  afterEach(async () => { await i18n.changeLanguage('sv') })

  it('visar svenska mallar på svenska', () => {
    tillMallsteget()
    expect(screen.getByText('Kort & Koncis')).toBeInTheDocument()
  })

  it('visar engelska mallar på engelska — ingen svenska kvar', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    i18n.addResourceBundle('en', 'translation', NYA_EN, true, true)
    await i18n.changeLanguage('en')
    const { container } = render(<FocusCoverLetter onComplete={vi.fn()} onSkip={vi.fn()} onBack={vi.fn()} />, { wrapper })
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Warehouse worker' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Short and clear')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Kort & Koncis|Professionell och balanserad|Traditionell ton/)
  })

  it('den tomma brevikonen har läsbar färg i mörkt läge', () => {
    const kalla = readFileSync(resolve(__dirname, 'FocusCoverLetter.tsx'), 'utf8')
    expect(kalla).not.toMatch(/dark:text-stone-600/)
  })
})
