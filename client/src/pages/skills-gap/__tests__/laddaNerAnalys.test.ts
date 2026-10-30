/**
 * AIX7 — första steget ska följa med i den nedladdade analysen.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { laddaNerAnalys } from '../laddaNerAnalys'
import type { SkillsAnalysis } from '@/services/careerApi'

const t = ((key: string, opts?: unknown) =>
  typeof opts === 'string' ? opts : key) as never

function lasBlob(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.readAsText(blob)
  })
}

function analys(actionPlan: unknown[]): SkillsAnalysis {
  return {
    created_at: '2026-10-30T10:00:00Z',
    dream_job: 'Lagerarbetare',
    skills_comparison: [],
    action_plan: actionPlan,
  } as unknown as SkillsAnalysis
}

let blobar: Blob[] = []

beforeEach(() => {
  blobar = []
  window.URL.createObjectURL = vi.fn((b: Blob) => {
    blobar.push(b)
    return 'blob:test'
  })
  window.URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

describe('laddaNerAnalys — första steget', () => {
  it('skriver ut forstaSteg under handlingsplanens steg', async () => {
    laddaNerAnalys(
      analys([
        { order: 1, title: 'Truckkort', description: 'Skaffa A-B', forstaSteg: 'Ring en trafikskola' },
        { order: 2, title: 'CV', description: 'Uppdatera' },
      ]),
      [],
      t,
      'sv'
    )
    const text = await lasBlob(blobar[0])
    expect(text).toContain('1. Truckkort: Skaffa A-B')
    expect(text).toContain('Första steget: Ring en trafikskola')
    // steg utan forstaSteg (äldre analyser) får ingen tom rad
    expect(text.match(/Första steget/g)).toHaveLength(1)
  })
})
