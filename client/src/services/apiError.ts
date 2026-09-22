/**
 * Delade fel-helpers för Supabase-API-anrop. Tidigare bodde dessa inne i
 * supabaseApi.ts; extraherade 2026-05-09 så domän-filerna (cvApi, userApi,
 * jobsApi) kan importera dem utan cyklisk dep mot huvudfilen.
 */

export class APIError extends Error {
  // Parameter properties (`public code?: string` i konstruktorn) genererar
  // JS-tilldelningar och är inte "erasable" — `erasableSyntaxOnly` (TS 5.9,
  // tsconfig.app.json) fäller dem. Explicita fält + tilldelning i konstruktorn
  // ger samma runtime-beteende utan att kräva TS-specifik kodgenerering.
  code?: string
  status?: number

  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.status = status
  }
}

export function handleError(error: unknown): never {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'PGRST116'
  ) {
    throw new APIError('Resursen hittades inte', 'NOT_FOUND', 404)
  }
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '42501'
  ) {
    throw new APIError('Åtkomst nekad', 'FORBIDDEN', 403)
  }
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '23505'
  ) {
    throw new APIError('Resursen finns redan', 'CONFLICT', 409)
  }

  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Ett fel uppstod'
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined
  const status =
    error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
      ? error.status
      : undefined

  throw new APIError(message, code, status)
}
