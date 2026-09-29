import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmptyState } from './EmptyState'

const rendera = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('EmptyState — rubriknivå (SV12)', () => {
  it('standard är h3 (oförändrat för befintliga sidor)', () => {
    rendera(<EmptyState title="Tomt här" />)
    expect(screen.getByRole('heading', { level: 3, name: 'Tomt här' })).toBeTruthy()
  })
  it('headingLevel styr nivån i båda varianterna', () => {
    rendera(<EmptyState title="Full" headingLevel="h2" />)
    rendera(<EmptyState title="Kompakt" compact headingLevel="h4" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Full' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 4, name: 'Kompakt' })).toBeTruthy()
  })
})
