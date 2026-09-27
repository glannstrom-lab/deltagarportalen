import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { VisaSomBanner } from './VisaSomBanner'
import { beskrivRoll, sakerLandning, VISA_SOM_NYCKEL, type VisaSomKonto } from '@/services/visaSomApi'
import { useAuthStore } from '@/stores/authStore'

describe('sakerLandning', () => {
  it('släpper bara igenom interna sökvägar', () => {
    expect(sakerLandning('/consultant')).toBe('/consultant')
    expect(sakerLandning('/foretag')).toBe('/foretag')
    expect(sakerLandning('//evil.example')).toBe('/')
    expect(sakerLandning('https://evil.example')).toBe('/')
    expect(sakerLandning(null)).toBe('/')
  })
})

describe('beskrivRoll', () => {
  const bas: VisaSomKonto = { id: '1', email: 'x@example.com', namn: null, roll: 'USER', organisation: null, orgTyp: null, orgRoll: null, grupp: 'demo' }
  it('ger chef, konsulent, företag och deltagare', () => {
    expect(beskrivRoll({ ...bas, roll: 'CONSULTANT', orgRoll: 'chef' })).toBe('Chef')
    expect(beskrivRoll({ ...bas, roll: 'CONSULTANT' })).toBe('Konsulent')
    expect(beskrivRoll({ ...bas, orgRoll: 'arbetsgivare' })).toBe('Företag (kontaktperson)')
    expect(beskrivRoll(bas)).toBe('Deltagare')
  })
})

describe('VisaSomBanner', () => {
  beforeEach(() => sessionStorage.clear())

  const rendera = () => render(<MemoryRouter><VisaSomBanner /></MemoryRouter>)

  it('syns när fliken är inloggad som det markerade kontot', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'demo@jobin.se' } as never })
    sessionStorage.setItem(VISA_SOM_NYCKEL, 'demo@jobin.se')
    rendera()
    expect(screen.getByTestId('visa-som-banner').textContent).toContain('demo@jobin.se')
  })

  it('syns inte utan markering', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'demo@jobin.se' } as never })
    rendera()
    expect(screen.queryByTestId('visa-som-banner')).toBeNull()
  })

  it('syns inte när ett annat konto är inloggat än det markerade', () => {
    useAuthStore.setState({ user: { id: 'u2', email: 'glannstrom@gmail.com' } as never })
    sessionStorage.setItem(VISA_SOM_NYCKEL, 'demo@jobin.se')
    rendera()
    expect(screen.queryByTestId('visa-som-banner')).toBeNull()
  })
})
