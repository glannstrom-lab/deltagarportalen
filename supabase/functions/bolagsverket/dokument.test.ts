/**
 * bolagsverket /document/{id}: id:t gick ovaliderat till uppström och in i
 * Content-Disposition (2026-09-22).
 *
 * Kör: npx -y deno@2.9.6 test --allow-read supabase/functions/bolagsverket/dokument.test.ts
 *
 * `path.replace('/document/', '')` gav allt efter prefixet — inklusive
 * snedstreck och procentkodade tecken — och det sattes rakt in i
 * `${BOLAGSVERKET_API_BASE}/dokument/${dokumentId}` och i
 * `filename="${dokumentId}.zip"`. `/document/..%2F..%2Fnagot` blev alltså ett
 * anrop med projektets OAuth-token mot en annan sökväg hos Bolagsverket än
 * dokument-endpointen. id:t valideras nu mot en snäv form, kodas i URL:en,
 * och filnamnet byggs av det validerade värdet.
 */

import { arGiltigtDokumentId, dokumentUrl } from './dokument.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

Deno.test('giltiga dokument-id godtas', () => {
  for (const id of ['12345678', 'a1b2-c3d4', 'DOK_2024.01', '550e8400-e29b-41d4-a716-446655440000']) {
    assert(arGiltigtDokumentId(id), `borde godtas: ${id}`)
  }
})

Deno.test('id som kan styra om anropet avvisas', () => {
  for (const id of ['', '..', '../x', '..%2F..%2Fx', 'a/b', 'a%2Fb', 'a"b', 'a b', 'a\r\nX: y', '%00', 'x'.repeat(200)]) {
    assert(!arGiltigtDokumentId(id), `borde avvisas: ${JSON.stringify(id)}`)
  }
})

Deno.test('uppströms-URL:en kodar id:t', () => {
  assert(dokumentUrl('https://gw/v1', 'abc-1') === 'https://gw/v1/dokument/abc-1', dokumentUrl('https://gw/v1', 'abc-1'))
})

Deno.test('GRIND: /document-rutten validerar id:t innan det används', () => {
  const kalla = Deno.readTextFileSync(new URL('./index.ts', import.meta.url)).replace(/\r\n/g, '\n')
  const rutt = kalla.match(/path\.startsWith\('\/document\/'\)[\s\S]*?\n {4}\}/)?.[0]
  assert(rutt, 'hittar inte /document-rutten i index.ts')
  const validering = rutt.indexOf('arGiltigtDokumentId(')
  const hamtning = rutt.indexOf('fetchDocument(')
  assert(validering >= 0, '/document-rutten anropar inte arGiltigtDokumentId()')
  assert(validering < hamtning, 'valideringen måste ske före fetchDocument()')
  assert(!/\/dokument\/\$\{dokumentId\}/.test(kalla), 'uppströms-URL:en byggs fortfarande med rått id — använd dokumentUrl()')
})
