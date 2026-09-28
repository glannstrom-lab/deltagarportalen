import { strongPasswordSchema } from '@/lib/validations'

/** Samma regler som registreringen (strongPasswordSchema). */
export function losenordetDuger(pwd: string): boolean {
  return strongPasswordSchema.safeParse(pwd).success
}
