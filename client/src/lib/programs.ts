/**
 * Arbetsmarknadsprojekt som konsulent/deltagare kan tillhöra.
 *
 * Slugen matchar `profiles.program` (CHECK-constraint i 20260512_add_program_column.sql).
 * NULL/undefined på profilen = inget projekt valt.
 *
 * Sidor som villkoras på detta värde monteras separat i routes/navigation
 * när projekt-specifika vyer skapas.
 */

export type ProgramSlug = 'steg_till_arbete' | 'rusta_och_matcha'

export interface ProgramDef {
  slug: ProgramSlug
  label: string
  shortDescription: string
}

export const PROGRAMS: readonly ProgramDef[] = [
  {
    slug: 'steg_till_arbete',
    label: 'Steg till arbete',
    shortDescription: 'Förberedande insats för personer som behöver mer tid och stöd innan reguljär jobbsökning.',
  },
  {
    slug: 'rusta_och_matcha',
    label: 'Rusta och Matcha',
    shortDescription: 'Arbetsförmedlingens matchningstjänst — coachning mot direkt anställning eller studier.',
  },
] as const

export function getProgram(slug: string | null | undefined): ProgramDef | null {
  if (!slug) return null
  return PROGRAMS.find((p) => p.slug === slug) ?? null
}
