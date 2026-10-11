/** Orden i Min dags hälsning — egen modul så att komponentfilen bara exporterar komponenter. */

/** "God morgon" före tio, "God kväll" från fem, annars "Hej". */
export function halsning(nu: Date): string {
  const h = nu.getHours()
  if (h >= 5 && h < 10) return 'God morgon'
  if (h >= 17) return 'God kväll'
  return 'Hej'
}

const TAL = ['Inga', 'En', 'Två', 'Tre', 'Fyra', 'Fem', 'Sex', 'Sju', 'Åtta', 'Nio', 'Tio', 'Elva', 'Tolv']

/** "Fyra saker i dag." — ord upp till tolv. */
export function sakerIDag(n: number): string {
  const tal = n < TAL.length ? TAL[n] : String(n)
  return `${tal} ${n === 1 ? 'sak' : 'saker'} i dag.`
}
