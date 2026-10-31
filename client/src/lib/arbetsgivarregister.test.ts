import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  arEnskildFirma,
  byggRegister,
  dubblettNyckel,
  hittaDubbletter,
  normaliseraForetagsnamn,
  normaliseraOrgnr,
  orgnrForKollega,
  type PlatsUnderlag,
} from './arbetsgivarregister'
import { ARBETSGIVARREGISTER_FINNS } from '@/services/arbetsgivarregisterApi'

const plats = (over: Partial<PlatsUnderlag>): PlatsUnderlag => ({
  consultant_id: 'k1',
  company_name: 'Lidl Sverige KB',
  org_number: null,
  updated_at: '2026-10-01T10:00:00Z',
  ...over,
})

describe('normaliseraOrgnr', () => {
  it('ger samma värde med och utan bindestreck/mellanrum', () => {
    expect(normaliseraOrgnr('556677-8899')).toBe('5566778899')
    expect(normaliseraOrgnr('5566778899')).toBe('5566778899')
    expect(normaliseraOrgnr(' 556677 8899 ')).toBe('5566778899')
  })
  it('kortar tolvsiffrigt och avvisar fel längd', () => {
    expect(normaliseraOrgnr('165566778899')).toBe('5566778899')
    expect(normaliseraOrgnr('12345')).toBeNull()
    expect(normaliseraOrgnr(null)).toBeNull()
  })
})

describe('normaliseraForetagsnamn', () => {
  it('ignorerar versaler, bolagsform och skiljetecken', () => {
    const k = normaliseraForetagsnamn('Nordfrakt AB')
    expect(k).toBe('nordfrakt')
    expect(normaliseraForetagsnamn('NORDFRAKT Aktiebolag')).toBe(k)
    expect(normaliseraForetagsnamn('AB Nordfrakt')).toBe(k)
    expect(normaliseraForetagsnamn('Nord-frakt, AB.')).toBe(k)
    expect(normaliseraForetagsnamn('  nordfrakt ')).toBe(k)
  })
  it('tål tomt', () => {
    expect(normaliseraForetagsnamn(null)).toBe('')
  })
})

describe('DP2 — enskild firmas org.nr visas aldrig för kollegor', () => {
  it('personnummerliknande nummer maskas', () => {
    expect(arEnskildFirma('850101-1234')).toBe(true)
    expect(orgnrForKollega('850101-1234')).toBeNull()
    expect(orgnrForKollega('19850101-1234')).toBeNull()
  })
  it('aktiebolagets nummer visas formaterat', () => {
    expect(orgnrForKollega('5566778899')).toBe('556677-8899')
    expect(arEnskildFirma('556677-8899')).toBe(false)
  })
  it('namn som säger enskild firma maskar även ett giltigt nummer', () => {
    expect(orgnrForKollega('556677-8899', 'Anna Svensson Enskild firma')).toBeNull()
  })
  it('oläsligt nummer visas inte', () => {
    expect(orgnrForKollega('123')).toBeNull()
    expect(orgnrForKollega('999999-9999', null)).toBe('999999-9999')
    expect(orgnrForKollega('001399-9999')).toBeNull()
  })
  it('byggRegister läcker inte personnumret, inte ens när en annan rad i gruppen är ett bolag-nummer', () => {
    const reg = byggRegister([
      plats({ company_name: 'Annas Städ', org_number: '850101-1234' }),
      plats({ company_name: 'Annas Städ', org_number: '850101-1234', updated_at: '2026-10-02T00:00:00Z' }),
    ])
    expect(reg).toHaveLength(1)
    expect(reg[0].orgnr).toBeNull()
    expect(JSON.stringify(reg)).not.toContain('8501011234')
    expect(JSON.stringify(reg)).not.toContain('850101-1234')
  })
})

describe('dubblettNyckel', () => {
  it('bär aldrig ett personnummer, men gärna ett bolags org.nr', () => {
    expect(dubblettNyckel('Annas Städ', '850101-1234')).toBe('namn:annasstäd')
    expect(dubblettNyckel('Lidl AB', '556677-8899')).toBe('org:5566778899')
  })
})

describe('byggRegister', () => {
  it('grupperar på org.nr oavsett skrivsätt och räknar platser', () => {
    const reg = byggRegister([
      plats({ company_name: 'Lidl AB', org_number: '556677-8899' }),
      plats({ company_name: 'LIDL aktiebolag', org_number: '5566778899', updated_at: '2026-10-05T00:00:00Z', consultant_id: 'k2' }),
    ])
    expect(reg).toHaveLength(1)
    expect(reg[0]).toMatchObject({ antalPlatser: 2, orgnr: '556677-8899', agareId: 'k2', senastAndrad: '2026-10-05T00:00:00Z' })
  })
  it('haka på namn-only-plats till en post med org.nr', () => {
    const reg = byggRegister([
      plats({ company_name: 'Lidl AB', org_number: '556677-8899' }),
      plats({ company_name: 'lidl', org_number: null }),
    ])
    expect(reg).toHaveLength(1)
    expect(reg[0].antalPlatser).toBe(2)
  })
  it('hoppar över rader utan namn och nummer', () => {
    expect(byggRegister([plats({ company_name: '  ', org_number: null })])).toEqual([])
  })
  it('bär inga deltagar- eller kontaktfält', () => {
    const reg = byggRegister([plats({})])
    expect(Object.keys(reg[0]).sort()).toEqual(
      ['agareId', 'antalPlatser', 'namn', 'nyckel', 'orgnr', 'senastAndrad'].sort(),
    )
  })
})

describe('hittaDubbletter', () => {
  const reg = byggRegister([plats({ company_name: 'Nordfrakt AB', org_number: '556677-8899' })])
  it('träffar på org.nr med/utan bindestreck', () => {
    expect(hittaDubbletter(reg, { namn: 'Något helt annat', orgnr: '5566778899' })).toHaveLength(1)
    expect(hittaDubbletter(reg, { namn: 'x', orgnr: '556677-8899' })).toHaveLength(1)
  })
  it('träffar på namn utan AB, i versaler', () => {
    expect(hittaDubbletter(reg, { namn: 'NORDFRAKT' })).toHaveLength(1)
    expect(hittaDubbletter(reg, { namn: 'Nordfrakt Aktiebolag' })).toHaveLength(1)
  })
  it('ingen träff för annat företag eller tomt', () => {
    expect(hittaDubbletter(reg, { namn: 'Sydfrakt' })).toEqual([])
    expect(hittaDubbletter(reg, { namn: '' })).toEqual([])
  })
})

describe('flaggan och migrationen', () => {
  it('registret är avstängt tills migrationen körts', () => {
    expect(ARBETSGIVARREGISTER_FINNS).toBe(false)
  })
  it('migrationen revokerar PUBLIC och anon, ger authenticated, kontrollerar personal och returnerar inga deltagarfält', () => {
    const sql = readFileSync(resolve(__dirname, '../../../supabase/migrations/20261031_fn13_arbetsgivarregister.sql'), 'utf8')
    expect(sql).toMatch(/revoke all on function public\.arbetsgivarregister\(uuid\) from public/i)
    expect(sql).toMatch(/revoke all on function public\.arbetsgivarregister\(uuid\) from anon/i)
    expect(sql).toMatch(/grant execute on function public\.arbetsgivarregister\(uuid\) to authenticated/i)
    expect(sql).toMatch(/organization_members me/)
    const returns = sql.slice(sql.indexOf('returns table'), sql.indexOf('language plpgsql'))
    for (const forbjudet of ['participant', 'contact_', 'phone', 'email']) expect(returns).not.toContain(forbjudet)
    // DP2: org.nr släcks om någon rad i gruppen inte är ett giltigt organisationsnummer
    expect(sql).toMatch(/count\(m\.orgnr_ok\) = count\(\*\)/)
    expect(sql).toMatch(/substr\(p\.siffror, 3, 1\) >= '2'/)
  })
})
