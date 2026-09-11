// KA3 (2026-09-12): Konsulentvyn: rapportutkast till uppdragsgivaren.
// Flyttad ordagrant ur api/ai.js. Sanningsregeln läggs på i ./index.js, inte här.

module.exports = {
  // Konsulent: rapportutkast från journalanteckningar + måldata.
  // Klienten skickar ALDRIG deltagarens namn — personen refereras som
  // "deltagaren" (GDPR-minimering; callAI:s PII-sanering gäller dessutom).
  'konsulent-rapportutkast': (data) => {
    const entries = Array.isArray(data?.entries) ? data.entries.slice(0, 60) : [];
    const goals = Array.isArray(data?.goals) ? data.goals.slice(0, 20) : [];
    const entriesText = entries
      .map((e) => `- [${e.date || 'okänt datum'}] (${e.category || 'GENERAL'}) ${e.content || ''}`)
      .join('\n');
    const goalsText = goals
      .map((g) => `- ${g.title || ''} — status: ${g.status || 'okänd'}${g.deadline ? ', deadline: ' + g.deadline : ''}${typeof g.progress === 'number' ? ', framsteg: ' + g.progress + '%' : ''}`)
      .join('\n');
    return {
      system: 'Du är en erfaren arbetskonsulent som skriver sakliga periodrapporter om deltagare i arbetsmarknadsinsatser. Skriv konkret och neutralt på svenska — inga värdeomdömen utan grund i underlaget, ingen utfyllnad. Hitta ALDRIG på händelser, datum eller aktiviteter som inte finns i underlaget; saknas underlag för en rubrik, skriv det rakt ut. Referera alltid till personen som "deltagaren". Strukturera rapporten med rubrikerna: Sammanfattning, Genomförda aktiviteter, Måluppföljning, Planering framåt.',
      user: `Skriv ett utkast till periodrapport för perioden ${data?.periodLabel || 'senaste perioden'}.\n\nJOURNALANTECKNINGAR:\n${entriesText || 'Inga anteckningar under perioden.'}\n\nMÅL:\n${goalsText || 'Inga registrerade mål.'}\n\nSkriv rapportutkastet:`,
      maxTokens: 1500,
      responseKey: 'utkast'
    };
  },
};
