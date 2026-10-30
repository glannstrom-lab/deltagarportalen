import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfirmDialogProvider } from '@/components/ui'
import { ApplicationCard } from './ApplicationCard'
import type { Application } from '@/types/application.types'

const dagarSedan = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const app = (over: Partial<Application> = {}): Application => ({
  id: 'a1', userId: 'u1', status: 'applied', priority: 'medium',
  jobTitle: 'Butikssäljare', companyName: 'Ica Maxi',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...over,
} as Application)

const rita = (a: Application, variant: 'compact' | 'default') =>
  render(<ConfirmDialogProvider><ApplicationCard application={a} variant={variant} /></ConfirmDialogProvider>)

describe('ApplicationCard — AIX5-markering', () => {
  for (const variant of ['compact', 'default'] as const) {
    it(`${variant}: avslag ger markering`, () => {
      rita(app({ status: 'rejected' }), variant)
      expect(screen.getByTestId('uppfoljning-markering')).toBeTruthy()
    })
    it(`${variant}: skickad för 14 dagar sedan ger markering`, () => {
      rita(app({ applicationDate: dagarSedan(14) }), variant)
      expect(screen.getByTestId('uppfoljning-markering')).toBeTruthy()
    })
    it(`${variant}: skickad för 13 dagar sedan ger ingen`, () => {
      rita(app({ applicationDate: dagarSedan(13) }), variant)
      expect(screen.queryByTestId('uppfoljning-markering')).toBeNull()
    })
    it(`${variant}: utan datum och arkiverad ger ingen`, () => {
      rita(app({}), variant)
      expect(screen.queryByTestId('uppfoljning-markering')).toBeNull()
      rita(app({ status: 'rejected', archivedAt: new Date().toISOString() }), variant)
      expect(screen.queryByTestId('uppfoljning-markering')).toBeNull()
    })
  }
})
