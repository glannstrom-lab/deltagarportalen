/**
 * af-trends svarade 500 utan felkod på varje fel och fyllde i `|| 0` när
 * JobSearch svarade 200 utan träffsiffra (en trasig respons blev "0 annonser").
 * Nu: 502/504 med felkod, och en saknad siffra kastar. Källan läses — Deno.serve
 * vid import gör att funktionen inte går att köra under vitest.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const src = readFileSync(resolve(__dirname, '../../../supabase/functions/af-trends/index.ts'), 'utf-8')

describe('af-trends: avbrott uppströms', () => {
  it('yttre catch svarar 502/504 med AF_UPSTREAM_ERROR/AF_TIMEOUT, inte 500', () => {
    const fangst = src.slice(src.lastIndexOf("console.error('[af-trends] Error:'"))
    expect(fangst).toMatch(/AF_TIMEOUT/)
    expect(fangst).toMatch(/AF_UPSTREAM_ERROR/)
    expect(fangst).toMatch(/status:\s*timeoutFel \? 504 : 502/)
    expect(fangst.slice(0, 900)).not.toMatch(/status:\s*500/)
  })

  it('marknadsstatistiken fyller inte i 0 när total.value saknas', () => {
    expect(src).not.toMatch(/total\?\.value \|\| 0/)
    expect(src).toMatch(/typeof d\?\.total\?\.value !== 'number'/)
  })

  it('ingen väg svarar 200 med tom lista vid fel', () => {
    expect(src).not.toMatch(/skills:\s*\[\]\s*\}/)
    expect(src).not.toMatch(/searches:\s*\[\]\s*\}/)
  })
})
