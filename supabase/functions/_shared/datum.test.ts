/**
 * Kör: npx -y deno@2.9.6 test supabase/functions/_shared/datum.test.ts
 *
 * Edge-runtimen kör i UTC. Deno på Windows struntar i TZ-variabeln och tar
 * värdmaskinens zon — på en svensk utvecklardator hade testerna alltså gått
 * gröna även UTAN `timeZone` i koden (mutationsprövat: de gjorde det). Därför
 * simulerar testet runtimen: ett anrop som inte anger tidszon får UTC.
 */

import { datumISverige, svensktDatum } from './datum.ts'

const original = Date.prototype.toLocaleDateString
Date.prototype.toLocaleDateString = function (
  this: Date,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions,
) {
  return original.call(this, locales, { timeZone: 'UTC', ...options })
}

Deno.test('kontroll: simuleringen gäller — utan timeZone blir 22:30 UTC gårdagen', () => {
  lika(new Date('2026-09-29T22:30:00Z').toLocaleDateString('sv-SE'), '2026-09-29')
})

function lika(fick: string, vantat: string) {
  if (fick !== vantat) throw new Error(`fick "${fick}", väntade "${vantat}"`)
}

Deno.test('00:30 svensk sommartid (22:30 UTC dagen före) är det nya dygnet', () => {
  lika(datumISverige(new Date('2026-09-29T22:30:00Z')), '2026-09-30')
})

Deno.test('00:30 svensk vintertid (23:30 UTC dagen före) är det nya dygnet', () => {
  lika(datumISverige(new Date('2026-01-14T23:30:00Z')), '2026-01-15')
})

Deno.test('mitt på dagen: samma dygn i båda', () => {
  lika(datumISverige(new Date('2026-09-22T12:00:00Z')), '2026-09-22')
})

Deno.test('inbjudans utgångsdatum i mejlet: svensk klartext för det svenska dygnet', () => {
  // expires_at = now() + 7 days för en inbjudan skapad 2026-09-23 00:30 svensk tid.
  lika(svensktDatum(new Date('2026-09-29T22:30:00Z')), '30 september 2026')
})

Deno.test('månadsformat (inaktivitetsmejlet)', () => {
  lika(svensktDatum(new Date('2026-08-31T22:30:00Z'), { year: 'numeric', month: 'long' }), 'september 2026')
})
