/**
 * Tolkning av en begäran till ai-career-assistant (2026-09-22).
 *
 * Egen modul eftersom index.ts anropar Deno.serve() vid import. Se
 * begaran.test.ts: saknade `params` kastade inne i promptbyggaren och blev
 * 500 i stället för 400.
 */

export type AssistantType = 'interview-prep' | 'salary-compass' | 'networking-help' | 'education-guide'

const TYPER: readonly AssistantType[] = ['interview-prep', 'salary-compass', 'networking-help', 'education-guide']

export type Tolkning =
  | { ok: true; type: AssistantType; params: Record<string, unknown> }
  | { ok: false; error: string }

export function tolkaBegaran(body: unknown): Tolkning {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Ogiltig begäran' }
  }
  const { type, params } = body as { type?: unknown; params?: unknown }
  if (typeof type !== 'string' || !(TYPER as readonly string[]).includes(type)) {
    return { ok: false, error: 'Invalid assistant type' }
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return { ok: false, error: 'params saknas eller har fel form' }
  }
  return { ok: true, type: type as AssistantType, params: params as Record<string, unknown> }
}
