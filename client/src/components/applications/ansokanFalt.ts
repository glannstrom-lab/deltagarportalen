/**
 * Företag och roll ur en ansökan — samma ordning som resten av ansökningsvyn:
 * det uttryckliga fältet först, annars annonsdatan. Tomt blir `undefined`, så
 * att prompten får en lucka i stället för ett påhittat namn.
 */

import type { Application } from '@/types/application.types'

type JobDataLas = { employer?: { name?: string }; headline?: string } | undefined

export function foretagOchRoll(ansokan: Pick<Application, 'companyName' | 'jobTitle' | 'jobData'>): { foretag?: string; roll?: string } {
  const jobData = ansokan.jobData as JobDataLas
  const foretag = (ansokan.companyName || jobData?.employer?.name || '').trim()
  const roll = (ansokan.jobTitle || jobData?.headline || '').trim()
  return { foretag: foretag || undefined, roll: roll || undefined }
}

/** Antal [luckor] kvar i en text — det personen själv ska fylla i. */
export function antalLuckor(text: string): number {
  return (text.match(/\[[^\]\n]{2,60}\]/g) ?? []).length
}
