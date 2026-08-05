import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, useTheme, useDarkMode } from './ThemeContext'

/**
 * Temat är inte en smaksak här — hög kontrast och mörkt läge är
 * tillgänglighetsinställningar (DESIGN.md, WCAG 2.1 AA). Två saker måste
 * hålla: valet ska överleva en omladdning, och 'system' ska följa OS:et
 * i realtid utan att skriva över ett uttryckligt val.
 */
type Lyssnare = (e: MediaQueryListEvent) => void

let systemMörkt = false
let lyssnare: Lyssnare[] = []

function installeraMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-color-scheme: dark') ? systemMörkt : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_: string, cb: Lyssnare) => { lyssnare.push(cb) },
      removeEventListener: (_: string, cb: Lyssnare) => {
        lyssnare = lyssnare.filter(l => l !== cb)
      },
      dispatchEvent: vi.fn(),
    }),
  })
}

const byteAvSystemtema = (mörkt: boolean) => {
  systemMörkt = mörkt
  act(() => {
    lyssnare.forEach(cb => cb({ matches: mörkt } as MediaQueryListEvent))
  })
}

function Prov() {
  const { theme, setTheme, isDark, toggleDarkMode, systemPreference } = useTheme()
  const { isDark: isDarkFrånKortHook } = useDarkMode()

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="isDark">{String(isDark)}</span>
      <span data-testid="isDarkKort">{String(isDarkFrånKortHook)}</span>
      <span data-testid="system">{systemPreference}</span>
      <button onClick={() => setTheme('dark')}>mörkt</button>
      <button onClick={() => setTheme('light')}>ljust</button>
      <button onClick={() => setTheme('system')}>system</button>
      <button onClick={toggleDarkMode}>växla</button>
    </div>
  )
}

const rendera = () => render(<ThemeProvider><Prov /></ThemeProvider>)
const klicka = (namn: string) => act(() => { screen.getByText(namn).click() })

describe('ThemeContext', () => {
  beforeEach(() => {
    systemMörkt = false
    lyssnare = []
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    installeraMatchMedia()
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('startar i "system" när inget är sparat', () => {
    rendera()

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('isDark')).toHaveTextContent('false')
  })

  it('följer OS:et när temat är "system"', () => {
    systemMörkt = true
    rendera()

    expect(screen.getByTestId('system')).toHaveTextContent('dark')
    expect(screen.getByTestId('isDark')).toHaveTextContent('true')
  })

  it('läser tillbaka ett sparat val vid montering', () => {
    localStorage.setItem('theme', 'dark')

    rendera()

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('isDark')).toHaveTextContent('true')
  })

  it('ignorerar skräp i localStorage och faller tillbaka på system', () => {
    localStorage.setItem('theme', 'neonrosa')

    rendera()

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
  })

  it('sparar valet så det överlever omladdning', () => {
    rendera()

    klicka('mörkt')

    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('sätter och tar bort .dark på html-elementet', () => {
    rendera()

    klicka('mörkt')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    klicka('ljust')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('reagerar på att OS:et byter tema medan sidan är öppen', () => {
    rendera()
    expect(screen.getByTestId('isDark')).toHaveTextContent('false')

    byteAvSystemtema(true)

    expect(screen.getByTestId('system')).toHaveTextContent('dark')
    expect(screen.getByTestId('isDark')).toHaveTextContent('true')
  })

  it('ett uttryckligt val vinner över OS:et', () => {
    rendera()
    klicka('ljust')

    byteAvSystemtema(true)

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('isDark')).toHaveTextContent('false')
  })

  it('toggle från "system" låser fast motsatsen till nuvarande läge', () => {
    systemMörkt = true
    rendera()

    klicka('växla')

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('isDark')).toHaveTextContent('false')
  })

  it('toggle växlar fram och tillbaka mellan light och dark', () => {
    rendera()
    klicka('mörkt')

    klicka('växla')
    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    klicka('växla')
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('useDarkMode ger samma svar som useTheme', () => {
    rendera()
    klicka('mörkt')

    expect(screen.getByTestId('isDarkKort')).toHaveTextContent('true')
  })

  it('useTheme utanför providern kastar ett begripligt fel', () => {
    const tyst = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Prov />)).toThrow(/useTheme must be used within a ThemeProvider/)

    tyst.mockRestore()
  })

  it('avregistrerar OS-lyssnaren vid unmount', () => {
    const { unmount } = rendera()
    expect(lyssnare.length).toBeGreaterThan(0)

    unmount()

    expect(lyssnare).toHaveLength(0)
  })
})
