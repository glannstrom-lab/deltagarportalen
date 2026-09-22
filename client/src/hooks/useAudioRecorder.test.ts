/**
 * Regression 2026-09-22: mikrofonen kunde bli stående PÅ.
 *
 * `startRecording` väntar på `getUserMedia` — som i praktiken väntar på att
 * deltagaren svarar på webbläsarens behörighetsfråga. Två vägar lämnade en
 * ström som ingen längre ägde, med mikrofonindikatorn tänd:
 *
 *  1. Sidan lämnades medan frågan var öppen. Avmonteringens städning hade
 *     redan kört när strömmen kom — ingen stoppade den.
 *  2. "Spela in" klickades två gånger innan den första strömmen kommit.
 *     Den andra skrev över `streamRef`, och "Stoppa" stängde bara den.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioRecorder } from './useAudioRecorder'

type Spar = { stop: ReturnType<typeof vi.fn> }

function skapaStrom(): { strom: MediaStream; spar: Spar } {
  const spar = { stop: vi.fn() }
  return { strom: { getTracks: () => [spar] } as unknown as MediaStream, spar }
}

class FalskInspelare {
  static isTypeSupported = () => true
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  stream: MediaStream
  constructor(stream: MediaStream) { this.stream = stream }
  start() { this.state = 'recording' }
  stop() { this.state = 'inactive'; this.onstop?.() }
  pause() { this.state = 'paused' }
  resume() { this.state = 'recording' }
}

let vantande: Array<(s: MediaStream) => void>
const originalMedia = navigator.mediaDevices
const originalRecorder = (globalThis as { MediaRecorder?: unknown }).MediaRecorder

beforeEach(() => {
  vantande = []
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(() => new Promise<MediaStream>((r) => vantande.push(r))) },
  })
  ;(globalThis as { MediaRecorder?: unknown }).MediaRecorder = FalskInspelare
})

afterEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: originalMedia })
  ;(globalThis as { MediaRecorder?: unknown }).MediaRecorder = originalRecorder
})

describe('useAudioRecorder — mikrofonen släpps alltid', () => {
  it('stänger strömmen om sidan lämnats medan behörighetsfrågan var öppen', async () => {
    const { result, unmount } = renderHook(() => useAudioRecorder())
    let start!: Promise<boolean>
    act(() => { start = result.current.startRecording() })
    unmount()

    const { strom, spar } = skapaStrom()
    await act(async () => {
      vantande[0](strom)
      expect(await start).toBe(false)
    })
    expect(spar.stop).toHaveBeenCalled()
  })

  it('öppnar inte en andra ström vid dubbelklick — och Stoppa släpper allt', async () => {
    const { result } = renderHook(() => useAudioRecorder())
    let forsta!: Promise<boolean>
    let andra!: Promise<boolean>
    act(() => {
      forsta = result.current.startRecording()
      andra = result.current.startRecording()
    })

    const a = skapaStrom()
    const b = skapaStrom()
    await act(async () => {
      vantande[0]?.(a.strom)
      vantande[1]?.(b.strom)
      await forsta
      await andra
    })

    await act(async () => { await result.current.stopRecording() })
    // Varje ström som faktiskt öppnades ska vara stängd efter Stoppa.
    expect(a.spar.stop).toHaveBeenCalled()
    if (vantande.length > 1) expect(b.spar.stop).toHaveBeenCalled()
    // …och helst ska det bara ha öppnats en.
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1)
    expect(await andra).toBe(false)
  })
})
