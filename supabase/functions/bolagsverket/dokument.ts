/**
 * Validering av Bolagsverkets dokument-id (2026-09-22).
 *
 * Egen modul eftersom index.ts anropar Deno.serve() vid import och därför
 * inte går att importera i ett test. Se dokument.test.ts för bakgrunden.
 */

/**
 * Snäv form: bokstäver, siffror, punkt, understreck, bindestreck — max 128
 * tecken, och aldrig `..`. Det räcker för de id-former Bolagsverkets
 * dokumentlista ger (siffror/UUID) och utesluter allt som kan byta sökväg
 * hos uppström (`/`, `%2F`, `..`) eller bryta ut ur en header (`"`, CR/LF).
 */
export function arGiltigtDokumentId(id: string): boolean {
  return /^[A-Za-z0-9._-]{1,128}$/.test(id) && !id.includes('..')
}

/** Uppströms-URL med kodat id. Anropa bara med ett validerat id. */
export function dokumentUrl(bas: string, id: string): string {
  return `${bas}/dokument/${encodeURIComponent(id)}`
}
