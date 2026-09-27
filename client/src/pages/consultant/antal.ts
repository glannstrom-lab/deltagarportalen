/**
 * Ett tal med rätt böjt ord: "1 dag", "2 dagar".
 *
 * RK26/RR16 (rollspelet 2026-09-27): konsulentvyn skrev "1 dagar", "1 aktiva",
 * "1 olästa meddelanden". Nycklarna i sv.json saknar _one-form, och
 * konsulentvyn översätts inte (DESIGN.md §2) — så böjningen görs här, med
 * svenska literaler, i stället för att vänta på locale-filen.
 */
export function antal(n: number, ental: string, flertal: string): string {
  return `${n} ${n === 1 ? ental : flertal}`
}
