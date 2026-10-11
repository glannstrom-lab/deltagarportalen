/**
 * Kopplingsförfrågan, serversidan (beslut 2026-10-11). Två saker som inte får
 * glida, eftersom de är det som skiljer det här spåret från CR1 (avskrivet 2026-09-29):
 *
 *   1. Ingen användaruppräkning. Konsulenten får inte kunna läsa
 *      consultant_requests (raden bär participant_id), och mejlvägen till ett
 *      befintligt konto får inte gå via generateLink (som föll på "already
 *      registered" och gav konsulenten ett annat svar).
 *   2. Svaret går bara via RPC:n. Ingen UPDATE-policy på tabellen — det var den
 *      som saknade WITH CHECK och gjorde att ingen kunde svara.
 *
 * Mallen laddas på riktigt (mallar.ts är fri från Deno-importer).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getKopplingsforfraganEmailTemplate } from '../../../supabase/functions/send-invite-email/mallar.ts'

const las = (rel: string) => readFileSync(resolve(__dirname, rel), 'utf8').replace(/\r\n/g, '\n')
const migration = las('../../../supabase/migrations/20261011b_kopplingsforfragan.sql')
  .split('\n').filter((r) => !r.trimStart().startsWith('--')).join('\n')
const edge = las('../../../supabase/functions/send-invite-email/index.ts')

describe('kopplingsförfrågan — migrationen', () => {
  it('tar bort konsulentens läs- och skrivrätt på tabellen och lägger inga nya policyer', () => {
    expect(migration).toContain('drop policy if exists "Consultants can view own requests" on public.consultant_requests')
    expect(migration).toContain('drop policy if exists "Consultants can create requests" on public.consultant_requests')
    expect(migration).not.toMatch(/create\s+policy/i)
  })

  it('svaret skriver samtycket med texten — inte bara profiles.consultant_id', () => {
    const rpc = migration.slice(migration.indexOf('function public.besvara_kopplingsforfragan'))
    expect(rpc).toContain('insert into consultant_consents')
    expect(rpc).toContain("'consultant_request'")
    expect(rpc).toContain('insert into consultant_participants')
    expect(rpc).toMatch(/participant_id = v_uid/)
  })

  it('triggern hoppar över demokonton och inbjudningar åt någon annan', () => {
    const trig = migration.slice(migration.indexOf('function public.invitations_kopplingsforfragan'), migration.indexOf('function public.besvara_kopplingsforfragan'))
    expect(trig).toContain('is_demo')
    expect(trig).toContain('NEW.consultant_id is distinct from NEW.invited_by')
  })

  it('RPC:n når bara authenticated; triggerfunktionen ingen', () => {
    expect(migration).toContain('revoke all on function public.besvara_kopplingsforfragan(uuid, boolean, text) from anon')
    expect(migration).toContain('revoke all on function public.invitations_kopplingsforfragan() from authenticated')
  })
})

describe('kopplingsförfrågan — send-invite-email', () => {
  it('en väntande förfrågan ger inloggningslänk, aldrig generateLink', () => {
    const gren = edge.indexOf('if (arForfragan) {')
    const generate = edge.indexOf('generateLink({')
    expect(gren).toBeGreaterThan(-1)
    expect(gren).toBeLessThan(generate)
    expect(edge.slice(gren, gren + 120)).toContain('/#/my-consultant')
  })

  it('mallen eskaperar konsulentens namn och meddelande och lovar inget som inte är sant', () => {
    const html = getKopplingsforfraganEmailTemplate({
      consultantName: 'Kim <b>K</b>',
      actionUrl: 'https://www.jobin.se/#/my-consultant',
      message: 'Hej!\n<a href="x">klicka</a>',
    })
    expect(html).toContain('Kim &lt;b&gt;K&lt;/b&gt;')
    expect(html).not.toContain('<a href="x">')
    expect(html).toContain('Hej!<br>')
    expect(html).toContain('https://www.jobin.se/#/my-consultant')
    expect(html).toContain('Inget delas med')
  })
})
