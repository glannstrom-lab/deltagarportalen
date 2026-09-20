/**
 * DR2 (2026-09-20): mejl-cronerna svarade 200 även när varenda utskick fallit.
 * Vercel Cron läser inte svarskroppen, så en natt utan fungerande Resend gav
 * noll påminnelser och en grön körning.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { avgorSvar } = require('../../api/_utils/mejlutfall.js') as {
  avgorSvar: (u: { skickade: number; fel: number }) => { status: number; larm: string | null }
}

describe('avgorSvar', () => {
  it('inget att göra är inte ett fel', () => {
    expect(avgorSvar({ skickade: 0, fel: 0 })).toEqual({ status: 200, larm: null })
  })

  it('allt lyckades ger 200 utan larm', () => {
    expect(avgorSvar({ skickade: 5, fel: 0 })).toEqual({ status: 200, larm: null })
  })

  it('allt föll ger 500 — det är vägen ut som är trasig', () => {
    const svar = avgorSvar({ skickade: 0, fel: 4 })
    expect(svar.status).toBe(500)
    expect(svar.larm).toContain('Samtliga 4')
  })

  it('delvis fel ger 200 men larmar ändå', () => {
    const svar = avgorSvar({ skickade: 3, fel: 1 })
    expect(svar.status).toBe(200)
    expect(svar.larm).toContain('1 av 4')
  })
})

describe('båda cronerna använder regeln', () => {
  const las = (f: string) => readFileSync(resolve(__dirname, '../../api', f), 'utf-8')

  it.each(['pass-paminnelse.js', 'aktivitet-mejl.js'])('%s svarar med avgorSvar, inte hårdkodat 200', (fil) => {
    const kalla = las(fil)
    expect(kalla).toContain("require('./_utils/mejlutfall.js')")
    expect(kalla).toContain('res.status(svar.status).json(utfall)')
    // Det hårdkodade slutsvaret ska vara borta. 500-svaren vid lässtoppet
    // längre upp i filerna är en annan sak och får stå kvar.
    expect(kalla).not.toContain('return res.status(200).json(utfall)')
  })
})
