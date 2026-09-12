/**
 * PG2-rest: ett PostgREST-/schemafel (kod som PGRST201, 42703, 42P01, HTTP 4xx) är fast
 * tills koden ändras — "försök igen om en stund" är då osant. Nätfel är tillfälliga.
 */
export function felklass(error: unknown): 'tillfalligt' | 'fast' {
  const e = (error ?? {}) as { code?: unknown; status?: unknown; name?: unknown; message?: unknown }
  const code = typeof e.code === 'string' ? e.code : ''
  const status = typeof e.status === 'number' ? e.status : 0
  if (/^PGRST\d+/.test(code) || /^(42|22|23)[0-9A-Z]{3}$/.test(code) || (status >= 400 && status < 500)) return 'fast'
  return 'tillfalligt'
}
