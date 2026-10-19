import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { VisaSomBanner } from './VisaSomBanner'
import {
  beskrivRoll,
  demoLage,
  demoRoller,
  DEMO_KONTON,
  DEMO_URSPRUNG,
  sakerLandning,
  visaSomApi,
  VISA_SOM_NYCKEL,
  type VisaSomKonto,
} from '@/services/visaSomApi'
import { supabase } from '@/lib/supabase'
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

  // DL1 (2026-10-19): ett andra Visa som-konto i samma webbläsarprofil tar över
  // inloggningen (localStorage) medan markeringen (sessionStorage) står kvar.
  // Förut doldes raden tyst och listorna blev tomma — nu varnar den.
  it('varnar när ett annat konto tagit över fliken', () => {
    useAuthStore.setState({ user: { id: 'u2', email: 'anna.exempel@example.com' } as never })
    sessionStorage.setItem(VISA_SOM_NYCKEL, 'demo@jobin.se')
    rendera()
    expect(screen.queryByTestId('visa-som-banner')).toBeNull()
    const varning = screen.getByRole('alert')
    expect(varning).toHaveTextContent('Ett annat konto har loggats in i den här webbläsaren')
    expect(varning).toHaveTextContent('demo@jobin.se')
    expect(varning).toHaveTextContent('anna.exempel@example.com')
    expect(screen.getByRole('button', { name: 'Ladda om' })).toBeTruthy()
  })

  it('varnar inte utan inloggning', () => {
    useAuthStore.setState({ user: null } as never)
    sessionStorage.setItem(VISA_SOM_NYCKEL, 'demo@jobin.se')
    rendera()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

// Demoläget (2026-10-19): superadmin byter roll i samma fönster.
describe('demoläget', () => {
  const roller = [
    { id: 'c', email: 'demo@jobin.se', etikett: 'Kommunchef' },
    { id: 'a', email: 'anna.exempel@example.com', etikett: 'Anna (deltagare)' },
  ]
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('demoRoller plockar demots roller ur serverns lista, i fast ordning', () => {
    const bas = { namn: null, roll: null, organisation: null, orgTyp: null, orgRoll: null, grupp: 'demo' as const }
    const ut = demoRoller([
      { ...bas, id: '2', email: 'anna.exempel@example.com' },
      { ...bas, id: '9', email: 'nagon@example.com' },
      { ...bas, id: '1', email: 'demo@jobin.se' },
    ])
    expect(ut.map((r) => r.etikett)).toEqual(['Kommunchef', 'Anna (deltagare)'])
  })

  it('raden visar rollerna, markerar den aktuella och erbjuder vägen tillbaka', () => {
    useAuthStore.setState({ user: { id: 'a', email: 'anna.exempel@example.com' } as never })
    sessionStorage.setItem(VISA_SOM_NYCKEL, 'anna.exempel@example.com')
    sessionStorage.setItem(DEMO_URSPRUNG, JSON.stringify({ refreshToken: 'r', email: 'mikael@x.se' }))
    sessionStorage.setItem(DEMO_KONTON, JSON.stringify(roller))
    render(<MemoryRouter><VisaSomBanner /></MemoryRouter>)
    expect(screen.getByTestId('demo-rad')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Anna (deltagare)' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Kommunchef' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: /Tillbaka till mitt konto/ })).toHaveTextContent('mikael@x.se')
    expect(screen.queryByRole('button', { name: 'Avsluta och logga ut' })).toBeNull()
  })

  it('ett byte tar tillbaka superadmins session INNAN servern anropas — annars nekas det', async () => {
    sessionStorage.setItem(DEMO_URSPRUNG, JSON.stringify({ refreshToken: 'gammal', email: 'mikael@x.se' }))
    const ordning: string[] = []
    vi.spyOn(supabase.auth, 'refreshSession').mockImplementation(async () => {
      ordning.push('refresh')
      return { data: { session: { refresh_token: 'ny' }, user: null }, error: null } as never
    })
    vi.spyOn(visaSomApi, 'oppna').mockImplementation(async () => {
      ordning.push('oppna')
      throw new Error('stopp')
    })
    await expect(demoLage.byt(roller[0])).rejects.toThrow('stopp')
    expect(ordning).toEqual(['refresh', 'oppna'])
    // refresh-token roteras — den nya måste sparas, annars fungerar bara första bytet
    expect(JSON.parse(sessionStorage.getItem(DEMO_URSPRUNG)!).refreshToken).toBe('ny')
  })

  it('utgången egen inloggning ger ett begripligt fel och inget anrop till servern', async () => {
    sessionStorage.setItem(DEMO_URSPRUNG, JSON.stringify({ refreshToken: 'gammal', email: 'mikael@x.se' }))
    vi.spyOn(supabase.auth, 'refreshSession').mockResolvedValue({ data: { session: null, user: null }, error: new Error('x') } as never)
    const oppna = vi.spyOn(visaSomApi, 'oppna')
    await expect(demoLage.byt(roller[0])).rejects.toThrow('Din egen inloggning har gått ut')
    expect(oppna).not.toHaveBeenCalled()
  })
})
