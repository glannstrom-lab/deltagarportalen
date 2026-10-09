/**
 * Rådgivarens hälsning med röst (2026-10-09).
 *
 * Det som prövas är det som går att få fel utan att något typfel larmar:
 *   · rösten startar av sig själv bara när den får (inställning, lugnt läge,
 *     redan hörd den här sessionen)
 *   · den går alltid att stoppa (WCAG 1.4.2)
 *   · Översikt säger ingenting förrän svaret om användaren är inne
 *   · det infogade rådet tystnar där hälsningen tagit över
 *   · varje hälsning har sina ljudfiler, varje sidbild sina två stilar
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import fs from 'node:fs'
import path from 'node:path'
import { useSettingsStore } from '@/stores/settingsStore'
import { SIDHALSNINGAR, OVERSIKT_STEG, OVERSIKT_INGET, ljudFor } from '@/data/radgivarHalsningar'
import { SIDBILDER } from '@/data/sidbilder'

// ── En ljudattrapp som minns vad som hände ──────────────────────────────────

class FakeAudio {
  static senaste: FakeAudio[] = []
  src: string
  paused = true
  ended = false
  currentTime = 0
  preload = ''
  play = vi.fn(() => {
    this.paused = false
    this.emit('play')
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    this.paused = true
    this.emit('pause')
  })
  private lyssnare: Record<string, Array<() => void>> = {}
  constructor(src: string) {
    this.src = src
    FakeAudio.senaste.push(this)
  }
  addEventListener(t: string, f: () => void) {
    ;(this.lyssnare[t] ??= []).push(f)
  }
  removeEventListener(t: string, f: () => void) {
    this.lyssnare[t] = (this.lyssnare[t] ?? []).filter((g) => g !== f)
  }
  emit(t: string) {
    for (const f of this.lyssnare[t] ?? []) f()
  }
}

const oversikt = vi.hoisted(() => ({ svar: { data: undefined as unknown, isLoading: true, isError: false } }))
vi.mock('@/hooks/useOversiktHubSummary', () => ({
  useOversiktHubSummary: () => ({ ...oversikt.svar, refetch: () => {} }),
}))

import RadgivarHalsning from './RadgivarHalsning'
import { RadgivarTips } from './RadgivarPanel'

function rendera(sida: string) {
  return render(
    <MemoryRouter>
      <RadgivarHalsning pathname={sida} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  FakeAudio.senaste = []
  vi.stubGlobal('Audio', FakeAudio)
  sessionStorage.clear()
  useSettingsStore.setState({ radgivarRost: true, calmMode: false, showCoachWidget: true })
  oversikt.svar = { data: undefined, isLoading: true, isError: false }
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('hälsningen på en verktygssida', () => {
  it('visar rådgivarens text och knappen till nästa steg', () => {
    rendera('/jobb')
    const h = SIDHALSNINGAR.jobbHub
    expect(screen.getByText(h.sv)).toBeTruthy()
    const lank = screen.getByRole('link', { name: new RegExp(h.steg!.sv) })
    expect(lank.getAttribute('href')).toBe(h.steg!.till)
  })

  it('börjar tala av sig själv när rösten är på', () => {
    rendera('/jobb')
    const ljud = FakeAudio.senaste.at(-1)!
    expect(ljud.src).toBe(ljudFor('jobbHub', 'sv'))
    expect(ljud.play).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(700))
    expect(ljud.play).toHaveBeenCalledTimes(1)
  })

  it('är tyst när användaren stängt av rösten — texten står kvar', () => {
    useSettingsStore.setState({ radgivarRost: false })
    rendera('/jobb')
    act(() => vi.advanceTimersByTime(2000))
    expect(FakeAudio.senaste.at(-1)!.play).not.toHaveBeenCalled()
    expect(screen.getByText(SIDHALSNINGAR.jobbHub.sv)).toBeTruthy()
  })

  it('är tyst i lugnare läge', () => {
    useSettingsStore.setState({ calmMode: true })
    rendera('/jobb')
    act(() => vi.advanceTimersByTime(2000))
    expect(FakeAudio.senaste.at(-1)!.play).not.toHaveBeenCalled()
  })

  it('går att stoppa medan den talar (WCAG 1.4.2)', () => {
    rendera('/jobb')
    act(() => vi.advanceTimersByTime(700))
    const ljud = FakeAudio.senaste.at(-1)!
    const paus = screen.getByRole('button', { name: /pausa/i })
    fireEvent.click(paus)
    expect(ljud.pause).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /lyssna/i })).toBeTruthy()
  })

  it('andra besöket samma session: hopfälld och tyst', () => {
    rendera('/jobb')
    act(() => vi.advanceTimersByTime(700))
    act(() => FakeAudio.senaste.at(-1)!.emit('ended'))
    cleanup()
    rendera('/jobb')
    act(() => vi.advanceTimersByTime(2000))
    expect(FakeAudio.senaste.at(-1)!.play).not.toHaveBeenCalled()
    // Hopfälld = rådgivarens stycke syns inte, bara en rad med nästa steg.
    expect(screen.queryByText(SIDHALSNINGAR.jobbHub.sv)).toBeNull()
    expect(screen.getByRole('button', { expanded: false })).toBeTruthy()
  })

  it('/externa-resurser får sin egen hälsning, inte de sparade resursernas', () => {
    rendera('/externa-resurser')
    expect(screen.getByText(SIDHALSNINGAR.externalResources.sv)).toBeTruthy()
    expect(screen.queryByText(SIDHALSNINGAR.resources.sv)).toBeNull()
  })

  it('en sida utan rådgivare får ingen hälsning', () => {
    const { container } = rendera('/help')
    expect(container.textContent).toBe('')
  })
})

describe('hälsningen på Översikt', () => {
  it('säger ingenting medan svaret laddas', () => {
    const { container } = rendera('/oversikt')
    expect(container.textContent).toBe('')
    expect(FakeAudio.senaste).toHaveLength(0)
  })

  it('säger ingenting vid fel', () => {
    oversikt.svar = { data: undefined, isLoading: false, isError: true }
    const { container } = rendera('/oversikt')
    expect(container.textContent).toBe('')
  })
})

describe('det infogade rådet', () => {
  it('står tillbaka på en sida som har en hälsning', () => {
    const { container } = render(
      <MemoryRouter>
        <RadgivarTips pathname="/linkedin-optimizer" />
      </MemoryRouter>
    )
    expect(container.textContent).toBe('')
  })
})

describe('filerna finns', () => {
  const PUBLIC = path.resolve(__dirname, '../../../public')

  it('varje hälsning har ett klipp på svenska och engelska', () => {
    const nycklar = [
      ...Object.keys(SIDHALSNINGAR).filter((k) => k !== 'dashboard'),
      ...Object.keys(OVERSIKT_STEG).map((k) => `oversikt-${k}`),
      'oversikt-inget',
    ]
    expect(OVERSIKT_INGET.sv.length).toBeGreaterThan(0)
    const saknas = nycklar.flatMap((n) =>
      (['sv', 'en'] as const)
        .map((s) => ljudFor(n, s))
        .filter((f) => !fs.existsSync(path.join(PUBLIC, f)))
    )
    expect(saknas).toEqual([])
  })

  it('varje sidbild finns i BÅDA grafikstilarna', () => {
    const saknas = SIDBILDER.flatMap((k) =>
      (['mjuk', 'action'] as const)
        .map((s) => `illustrations/sida-${k}-${s}.webp`)
        .filter((f) => !fs.existsSync(path.join(PUBLIC, f)))
    )
    expect(saknas).toEqual([])
  })
})
