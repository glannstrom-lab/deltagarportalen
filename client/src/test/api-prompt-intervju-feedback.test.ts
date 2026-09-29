/** Intervjusimulatorns feedbackgren: 500 tokens utan resonemangsnivå gav tomt svar (2026-09-29). */
import { describe, it, expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PROMPTS } = require('../../api/_prompts/index.js') as {
  PROMPTS: Record<string, (d: unknown) => { maxTokens: number; reasoningEffort?: string }>
}

describe('intervju-simulator: feedbackgrenen', () => {
  it('har budget för tänkandet och låg resonemangsnivå', () => {
    const p = PROMPTS['intervju-simulator']({ roll: 'Lagerarbetare', anvandarSvar: 'Jag är noggrann.', tidigareFragor: [{ fraga: 'Berätta om dig själv' }] })
    expect(p.maxTokens).toBeGreaterThanOrEqual(800)
    expect(p.reasoningEffort).toBe('low')
  })
})
