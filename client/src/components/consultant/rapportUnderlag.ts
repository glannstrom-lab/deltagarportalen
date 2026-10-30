/**
 * AIX13: all text AI:n fick, i en sträng — det granskningen jämför utkastet mot.
 * Byggs ur samma payload som skickas, inte ur något som hämtas på nytt.
 */
export function rapportUnderlag(p: {
  periodLabel: string
  entries: Array<{ date: string; category: string; content: string }>
  goals: Array<{ title: string | null; status: string | null; deadline: string | null; progress: number | null }>
}): string {
  return [
    p.periodLabel,
    ...p.entries.map((e) => `[${e.date}] (${e.category}) ${e.content}`),
    ...p.goals.map((g) => `${g.title ?? ''} status: ${g.status ?? ''}${g.deadline ? ', deadline: ' + g.deadline : ''}${typeof g.progress === 'number' ? ', framsteg: ' + g.progress + '%' : ''}`),
  ].join('\n')
}
