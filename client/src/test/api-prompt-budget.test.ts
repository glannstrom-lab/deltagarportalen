/**
 * Tokenbudgeten måste rymma modellens TÄNKANDE plus svaret (2026-09-22).
 *
 * Den låsta modellen (`openai/gpt-oss-120b`) resonerar innan den svarar, och
 * resonemanget ryms i samma `max_tokens` som svaret. Räcker budgeten inte
 * kommer `content` tillbaka tomt och /api/ai svarar 502 "No response from AI"
 * — det ser ut som ett nätverksfel men är en budgetfråga.
 *
 * Intervjusimulatorns första fråga hade 200 tokens och föll för riktiga
 * användare (loggarna: 225+ resonemangstokens före svaret). CV-importen gick i
 * samma fälla 2026-08-19. Det här testet gör regeln maskinell: ingen gren av
 * någon prompt får ha en budget under golvet, och öppningsfrågan ska ha den
 * uttryckliga budget + låga resonemangsnivå som rättelsen gav den.
 */
import { describe, it, expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PROMPTS } = require('../../api/_prompts/index.js') as {
  PROMPTS: Record<string, (data: unknown) => { maxTokens: number; reasoningEffort?: string }>
}

/** Under det här räcker budgeten inte ens för ett kort resonemang + ett kort svar. */
const GOLV = 400

/** Underlag som tvingar fram varje gren som finns i dag. */
const UNDERLAG: unknown[] = [
  {},
  { roll: 'Lagerarbetare' },
  { roll: 'Lagerarbetare', anvandarSvar: 'Jag heter Anna.', tidigareFragor: [{ fraga: 'Berätta om dig själv' }] },
  { responsLage: 'short', meddelande: 'hej' },
  { responsLage: 'detailed', meddelande: 'hej' },
  { language: 'en' },
]

describe('promptbudgetar rymmer resonemang + svar', () => {
  for (const namn of Object.keys(PROMPTS)) {
    it(`${namn}: ingen gren under ${GOLV} tokens`, () => {
      for (const data of UNDERLAG) {
        let p
        try { p = PROMPTS[namn](data) } catch { continue }
        if (!p || typeof p.maxTokens !== 'number') continue
        expect(p.maxTokens, `${namn} med ${JSON.stringify(data)}`).toBeGreaterThanOrEqual(GOLV)
      }
    })
  }

  it('intervju-simulator: öppningsfrågan har budget för tänkandet och låg resonemangsnivå', () => {
    const p = PROMPTS['intervju-simulator']({ roll: 'Lagerarbetare' })
    expect(p.maxTokens).toBeGreaterThanOrEqual(800)
    expect(p.reasoningEffort).toBe('low')
  })
})
