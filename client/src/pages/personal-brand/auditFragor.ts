/**
 * Frågorna i "Din bild utåt".
 *
 * Strukturen (id, kategori, vart åtgärden leder) ligger här; texten ligger i
 * i18n under `personalBrand.audit.questions.<id>`. Före 2026-08-21 låg all
 * text hårdkodad på svenska i komponenten — 49 strängar — trots att filen
 * anropade `useTranslation()` utan att någonsin destrukturera `t`. En
 * engelsk användare fick hela checklistan på svenska.
 */

export type AuditKategori = 'online' | 'content' | 'network' | 'consistency'

export interface AuditFraga {
  id: string
  category: AuditKategori
  /** Vart knappen bredvid frågan leder. Etiketten ligger i i18n. */
  actionLink?: string
}

export const AUDIT_FRAGOR: readonly AuditFraga[] = [
  { id: 'linkedin-profile', category: 'online', actionLink: '/linkedin-optimizer' },
  { id: 'linkedin-photo', category: 'online' },
  { id: 'linkedin-headline', category: 'online', actionLink: '/linkedin-optimizer' },
  { id: 'google-search', category: 'online' },
  { id: 'personal-website', category: 'online', actionLink: '/personal-brand/portfolio' },
  { id: 'share-content', category: 'content', actionLink: '/personal-brand/visibility' },
  { id: 'own-content', category: 'content', actionLink: '/linkedin-optimizer' },
  { id: 'engage-others', category: 'content' },
  { id: 'expertise-shown', category: 'content' },
  { id: 'active-network', category: 'network' },
  { id: 'industry-events', category: 'network' },
  { id: 'mentors', category: 'network' },
  { id: 'recommendations', category: 'network' },
  { id: 'consistent-message', category: 'consistency' },
  { id: 'unique-value', category: 'consistency', actionLink: '/personal-brand/pitch' },
  { id: 'target-audience', category: 'consistency' },
] as const

export const AUDIT_KATEGORIER: readonly AuditKategori[] = [
  'online', 'content', 'network', 'consistency',
] as const

/**
 * Hur många frågor i en kategori som är ikryssade.
 *
 * Returnerar ett ANTAL, inte en procent. Procenten som stod här tidigare
 * hade alla obesvarade frågor i nämnaren, så den som ärligt gått igenom två
 * frågor och svarat ja på båda fick 13 % — ett underkänt prov på en
 * påbörjad lista. Ett antal av ett antal går att läsa som det som det är.
 */
export function antalIkryssade(
  svar: Record<string, boolean>,
  kategori?: AuditKategori
): number {
  const fragor = kategori ? AUDIT_FRAGOR.filter(f => f.category === kategori) : AUDIT_FRAGOR
  return fragor.filter(f => svar[f.id]).length
}

export function antalFragor(kategori?: AuditKategori): number {
  return kategori ? AUDIT_FRAGOR.filter(f => f.category === kategori).length : AUDIT_FRAGOR.length
}

/**
 * `toggleAnswer` lämnar kvar `false`-poster, så `Object.keys(svar).length`
 * är sant även för någon som kryssat i och ur en enda ruta. Det var det som
 * fick poängkortet att slå upp med "0 % — Behöver arbete".
 */
export function harBorjat(svar: Record<string, boolean>): boolean {
  return Object.values(svar).some(Boolean)
}
