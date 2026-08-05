import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  saveSpontaneousFocusDraft,
  loadSpontaneousFocusDraft,
  clearSpontaneousFocusDraft,
} from './spontaneousFocusDraft'

const KEY = 'spontaneous-focus-draft'

/**
 * Utkastet som bär över det deltagaren skrev i fokuslägets spontanansökan till
 * normalvyn. Tappas det bort får någon som redan kämpar med orken skriva om
 * hela meddelandet. Läsvägen måste tåla skräp i localStorage — den datan är
 * skriven av en tidigare version av appen och kan se ut hur som helst.
 */
describe('spontaneousFocusDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sparar och läser tillbaka utkastet', () => {
    saveSpontaneousFocusDraft({ industry: 'Lager', company: 'Nordlog AB', message: 'Hej!' })

    const draft = loadSpontaneousFocusDraft()
    expect(draft).toMatchObject({ industry: 'Lager', company: 'Nordlog AB', message: 'Hej!' })
  })

  it('stämplar utkastet med tidpunkt', () => {
    saveSpontaneousFocusDraft({ industry: '', company: 'Nordlog AB', message: '' })

    const draft = loadSpontaneousFocusDraft()
    expect(draft?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('returnerar null när inget är sparat', () => {
    expect(loadSpontaneousFocusDraft()).toBeNull()
  })

  it('returnerar null för trasig JSON i stället för att kasta', () => {
    localStorage.setItem(KEY, '{inte json')

    expect(loadSpontaneousFocusDraft()).toBeNull()
  })

  it('returnerar null när både företag och meddelande saknas', () => {
    localStorage.setItem(KEY, JSON.stringify({ industry: 'Lager', company: '', message: '' }))

    expect(loadSpontaneousFocusDraft()).toBeNull()
  })

  it('behåller utkastet om bara meddelandet är ifyllt', () => {
    localStorage.setItem(KEY, JSON.stringify({ message: 'Ett halvfärdigt brev' }))

    const draft = loadSpontaneousFocusDraft()
    expect(draft?.message).toBe('Ett halvfärdigt brev')
    expect(draft?.company).toBe('')
  })

  it('normaliserar fält av fel typ till tomma strängar', () => {
    localStorage.setItem(KEY, JSON.stringify({ industry: 42, company: 'AB', message: null }))

    const draft = loadSpontaneousFocusDraft()
    expect(draft).toEqual({ industry: '', company: 'AB', message: '', createdAt: '' })
  })

  it('clear tar bort utkastet', () => {
    saveSpontaneousFocusDraft({ industry: 'Lager', company: 'AB', message: 'Hej' })
    clearSpontaneousFocusDraft()

    expect(loadSpontaneousFocusDraft()).toBeNull()
  })

  it('sväljer skrivfel (privat läge) utan att kasta', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() =>
      saveSpontaneousFocusDraft({ industry: 'a', company: 'b', message: 'c' })
    ).not.toThrow()
  })

  it('sväljer raderingsfel utan att kasta', () => {
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => clearSpontaneousFocusDraft()).not.toThrow()
  })
})
