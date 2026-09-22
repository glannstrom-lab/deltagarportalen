/**
 * `t('nyckel') || 'reservtext'` faller aldrig tillbaka.
 *
 * i18next returnerar nyckeln själv när den saknas — en icke-tom sträng — så
 * `||` når aldrig reservtexten. Det enda mönstret åstadkommer är en andra,
 * oläst kopia av texten som ruttnar: i samtyckeskomponenterna stod det
 * 2026-09-22 att konsulenten kan se "din dagbok", fast RLS bara delar
 * humörloggen och den riktiga texten säger "Din dagbok delas aldrig".
 * 74 sådana reserver togs bort ur components/consent/.
 *
 * Vill du ha en reservtext: `t('nyckel', 'reservtext')` — den används
 * faktiskt när nyckeln saknas.
 *
 * Mutation: lägg tillbaka `|| 'Datadelning'` efter `t('datasharing.title')`
 * i DataSharingSettings.tsx → testet faller.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROT = join(__dirname, '..')

function filer(katalog: string): string[] {
  if (!existsSync(katalog)) return []
  const ut: string[] = []
  for (const e of readdirSync(katalog, { withFileTypes: true })) {
    const p = join(katalog, e.name)
    if (e.isDirectory()) ut.push(...filer(p))
    else if (/\.tsx?$/.test(e.name) && !/\.test\./.test(e.name)) ut.push(p)
  }
  return ut
}

describe('i18n: inga döda reservtexter', () => {
  it('ingen t(...) || … i components/ eller pages/', () => {
    const alla = [join(ROT, 'components'), join(ROT, 'pages')].flatMap(filer)
    expect(alla.length).toBeGreaterThan(300)
    const fynd: string[] = []
    for (const fil of alla) {
      readFileSync(fil, 'utf8').split('\n').forEach((rad, i) => {
        if (/(^|[^\w.])t\(\s*['"`][^'"`]+['"`][^()]*\)\s*\|\|/.test(rad)) {
          fynd.push(`${fil.slice(ROT.length + 1)}:${i + 1}`)
        }
      })
    }
    expect(fynd).toEqual([])
  })
})
