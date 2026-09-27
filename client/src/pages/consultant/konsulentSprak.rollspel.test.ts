/**
 * RK26/RR16 (rollspelet 2026-09-27): "1 dagar" på Rapporter och i PDF:en,
 * "1 aktiva", "1 olästa meddelanden" på Översikt, och Senaste aktivitet med
 * bara klockslag. Nycklarna i sv.json saknar _one-form; konsulentvyn böjer
 * därför själv (antal.ts) och skriver dag + tid (aktivitetstid.ts).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { antal } from './antal'
import { aktivitetstid } from './aktivitetstid'
import { placeringstidText } from '@/services/pdfReportGenerator'

describe('antal — ett av något i singular', () => {
  it('1 dag, 2 dagar, 0 dagar', () => {
    expect(antal(1, 'dag', 'dagar')).toBe('1 dag')
    expect(antal(2, 'dag', 'dagar')).toBe('2 dagar')
    expect(antal(0, 'dag', 'dagar')).toBe('0 dagar')
  })
})

describe('RR16: placeringstiden i PDF:en', () => {
  it('1 dag, inte 1 dagar — och fortfarande — utan underlag', () => {
    expect(placeringstidText(1)).toBe('1 dag')
    expect(placeringstidText(70)).toBe('70 dagar')
    expect(placeringstidText(null)).toBe('—')
  })

  it('Rapporter använder inte längre den obböjda nyckeln för dagar eller aktiva', () => {
    const kalla = readFileSync(resolve(__dirname, 'AnalyticsTab.tsx'), 'utf-8')
    expect(kalla).not.toMatch(/consultant\.analytics\.metrics\.days'/)
    expect(kalla).not.toMatch(/consultant\.analytics\.metrics\.activeCount'/)
  })
})

describe('RK26: aktivitetstid bär dagen', () => {
  const nu = new Date(2026, 8, 27, 14, 0)
  it('i dag / i går / datum / datum med år', () => {
    expect(aktivitetstid(new Date(2026, 8, 27, 10, 30).toISOString(), nu)).toBe('i dag 10:30')
    expect(aktivitetstid(new Date(2026, 8, 26, 8, 5).toISOString(), nu)).toBe('i går 08:05')
    expect(aktivitetstid(new Date(2026, 8, 22, 9, 15).toISOString(), nu)).toBe('22 sep 09:15')
    expect(aktivitetstid(new Date(2025, 11, 30, 9, 15).toISOString(), nu)).toBe('30 dec 2025 09:15')
  })
  it('ett trasigt värde blir —, inte "Invalid Date"', () => {
    expect(aktivitetstid('inte ett datum', nu)).toBe('—')
  })
})
