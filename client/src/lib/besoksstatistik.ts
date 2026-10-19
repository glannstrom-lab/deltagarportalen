/**
 * Besöksstatistik via Vercel Web Analytics (2026-10-19, beslut Mikael).
 *
 * Vercel räknar sidvisningar utan cookies. Det enda vi skickar är sidans VÄG —
 * aldrig frågesträngen och aldrig ett id. Det spelar roll här, för portalen har
 * personuppgifter i adressen:
 *   - /#/print/cv?data=<hela CV:t base64> (cv-pdf.js öppnar den i Chromium)
 *   - /#/visa-som?t=<engångsnyckel>&e=<e-post>
 *   - /#/invite/<kod>, /#/profile/shared/<delningskod>, deltagar-id i konsulentvyn
 *
 * HashRouter gör att hela appen ligger på "/" för Vercel; vägen läses därför ur
 * hashen och skickas som om den vore en vanlig sökväg.
 */
import type { BeforeSendEvent } from '@vercel/analytics/react'

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
const SIFFRA = /\/\d+(?=\/|$)/g

/** Vägar vars resterande del är en nyckel eller kod — bara prefixet räknas. */
const KODVAGAR = ['/invite', '/profile/shared', '/template-snapshot']

/** Räknas inte alls: interna renderingssidor och superadmins inloggning som annan. */
const UTESLUTNA = ['/print', '/template-snapshot', '/visa-som']

/** Sidans väg utan frågesträng, med id och koder ersatta. */
export function statistikvag(pathname: string): string {
  const utanFraga = pathname.split('?')[0] || '/'
  const kodvag = KODVAGAR.find((p) => utanFraga === p || utanFraga.startsWith(`${p}/`))
  if (kodvag) return utanFraga === kodvag ? kodvag : `${kodvag}/[kod]`
  return utanFraga.replace(UUID, '[id]').replace(SIFFRA, '/[id]')
}

/** Vägen ur en full adress: hashen om den är en appväg, annars sökvägen. */
export function vagUrAdress(adress: string): string {
  const url = new URL(adress)
  return url.hash.startsWith('#/') ? url.hash.slice(1) : url.pathname
}

export function arUtesluten(vag: string): boolean {
  return UTESLUTNA.some((p) => vag === p || vag.startsWith(`${p}/`))
}

/** beforeSend: skriv om varje händelse till origin + tvättad väg, eller släpp den. */
export function tvattaHandelse(handelse: BeforeSendEvent): BeforeSendEvent | null {
  const vag = statistikvag(vagUrAdress(handelse.url))
  if (arUtesluten(vag)) return null
  return { ...handelse, url: `${new URL(handelse.url).origin}${vag}` }
}
