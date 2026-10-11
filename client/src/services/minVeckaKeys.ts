/** React Query-nycklar för Min vecka — en ägare, en form (lärdomen 2026-07-27). */
export const MIN_VECKA_PLAN_KEY = ['min-vecka', 'plan'] as const
export const minVeckaSessionsKey = (mandag: string) => ['min-vecka', 'sessions', mandag] as const
/** Olästa meddelanden från konsulenten (beslut 2026-10-11) — Min vecka läser. */
export const MIN_VECKA_OLASTA_KEY = ['min-vecka', 'olasta-meddelanden'] as const
