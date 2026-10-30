// KA3 (2026-09-12): Konsulentvyn: rapportutkast till uppdragsgivaren.
// Flyttad ordagrant ur api/ai.js. Sanningsregeln läggs på i ./index.js, inte här.

const { underlagText } = require('./_namndtext');
const { katalogRader, postText, MAL_MAX } = require('./_aktivitetsforslag');

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

  // KF6 (2026-10-18): "Läget just nu" — kort lägesbild av en deltagare inför
  // möte eller överlämning. Underlaget minimeras i klienten
  // (components/consultant/lagesbildUnderlag.ts): frånvaro utan orsak, ingen
  // fritext ur planen, inga CONCERN-anteckningar, inget namn.
  'konsulent-lagesbild': (data) => {
    const u = data?.underlag || {};
    const n = u.narvaro || {};
    const plan = u.plan
      ? `status ${u.plan.status || 'okänd'}, start ${u.plan.start || 'okänt'}${u.plan.slut ? ', slut ' + u.plan.slut : ''}${typeof u.plan.timmarPerVecka === 'number' ? ', mål ' + u.plan.timmarPerVecka + ' h/vecka' : ''}${u.plan.mall ? ', mall: ' + u.plan.mall : ''}`
      : 'Ingen aktivitetsplan.';
    const journal = (Array.isArray(u.journal) ? u.journal.slice(0, 30) : [])
      .map((j) => `- [${j.datum || 'okänt datum'}] (${j.kategori || 'GENERAL'}) ${j.text || ''}`)
      .join('\n');
    const mal = (Array.isArray(u.mal) ? u.mal.slice(0, 20) : [])
      .map((g) => `- ${g.titel || ''} — status: ${g.status || 'okänd'}${g.deadline ? ', deadline ' + g.deadline : ''}`)
      .join('\n');
    return {
      system: 'Du ger en arbetskonsulent en kort lägesbild av en deltagare inför ett möte eller en överlämning. Skriv på svenska, sakligt och kort: högst sex punkter, en mening var, sist en punkt som börjar "Att ta upp:". Varje punkt slutar med källan inom hakparentes: [journal ÅÅÅÅ-MM-DD], [närvaro], [mål], [plan] eller [möte]. Hitta ALDRIG på händelser, siffror eller orsaker som inte står i underlaget. Gissa aldrig varför någon varit frånvarande och skriv inget om hälsa. Inga värdeomdömen om personen. Saknas underlag, skriv det. Referera alltid till personen som "deltagaren".',
      user: `Dagens datum: ${u.idag || 'okänt'}

PLAN:
${plan}

NÄRVARO SENASTE ${n.dagar || 28} DAGARNA (pass): närvarande ${n.narvarande ?? 0}, frånvaro ${n.franvaro ?? 0}, ej markerat ${n.ejMarkerat ?? 0}. Kommande pass: ${n.kommande ?? 0}.

NÄSTA MÖTE: ${u.nastaMote || 'inget bokat'}

JOURNAL (senaste först):
${journal || 'Inga anteckningar.'}

MÅL:
${mal || 'Inga registrerade mål.'}

Skriv lägesbilden:`,
      maxTokens: 900,
      reasoningEffort: 'low',
      responseKey: 'lagesbild'
    };
  },

  // AIX11 (2026-10-30): journalpost från stolpar. Stolparna är ENDA indata — inget
  // namn, ingen tidigare journal, ingen plan. Datum, klockslag och kontaktform
  // fyller koden i (journalSol.ts, fälten i formuläret); AI:n skriver bara texten.
  // Klienten varnar INNAN anrop om stolparna innehåller hälsoord
  // (components/consultant/utkastGranskare.ts) och granskar svaret efteråt.
  'konsulent-journalpost': (data) => {
    const stolpar = typeof data?.stolpar === 'string' ? data.stolpar.trim().slice(0, 1500) : '';
    return {
      system: 'Du hjälper en arbetskonsulent att skriva en journalpost efter en kontakt med en deltagare. Gör stolparna till två till fem korta, sakliga meningar på svenska, i dåtid, med "deltagaren" som subjekt. Använd ENBART det som står i stolparna: hitta aldrig på händelser, orsaker, avsikter, siffror, namn eller överenskommelser, och lägg inte till råd eller uppföljning som inte nämns. Skriv inget datum, klockslag, kontaktform, rubrik eller signatur — det fyller systemet i. Inga värdeomdömen om personen (till exempel motiverad, engagerad, ointresserad, duktig, bra, dålig, positiv, negativ, attityd): står ett omdöme i en stolpe, skriv i stället vad deltagaren sa eller gjorde, eller lämna omdömet utan. Tolka inte varför något hände och gissa aldrig om hälsa. Behåll siffror, datum och namn exakt som i stolparna. Är stolparna för tunna för en mening, skriv bara det som finns. Svara med journalposten och inget annat.',
      user: `STOLPAR:
${stolpar || 'Inga stolpar.'}

Skriv journalposten:`,
      maxTokens: 600,
      reasoningEffort: 'low',
      responseKey: 'journalpost'
    };
  },

  // AIX16 (2026-10-30): text till nämnd och verksamhetsberättelse. Indata är BARA
  // aggregerade tal ur nämndrapporten (services/namndTextApi.ts undertrycker celler
  // under 5 före anropet och underlagText() gör det en gång till här). Validatorn
  // (_namndtext.js) stryker varje mening med ett tal som inte står i underlaget,
  // en orsaksförklaring eller en utveckling över tid. Svarsformen är ett platt objekt.
  'konsulent-namndtext': (data) => {
    return {
      system: 'Du hjälper en chef på en kommun att skriva en kort löptext till socialnämnden om aktivitetskravet under ett kvartal. Underlaget är en redan färdig räkning, uppdelad på grupper. Skriv två korta stycken på svenska, högst 140 ord sammanlagt, sakligt och i dåtid, och börja med "Under kvartalet". Använd ENBART tal som står ordagrant i underlaget och skriv dem som siffror utan mellanslag eller tusentalsavgränsare. Räkna aldrig ut nya tal: ingen summa, differens, andel, kvot eller medelvärde som inte redan står där, och inga ord som "hälften" eller "dubbelt". Förklara aldrig varför något blev som det blev: inga orsaker, inga antaganden om deltagarna och inget om vad som borde göras. Jämför inte med andra kvartal eller år, eftersom underlaget saknar sådana tal, och skriv inget om en ökning eller minskning. Värdera inte (inte bra eller dålig, inte positiv eller negativ). Uppgifter markerade "undertryckt" eller "—" redovisas inte: nämn dem inte och gissa aldrig ett värde. Skriv inga namn och inga enskilda personer, bara grupperna. Svara ENDAST med JSON, ingen annan text, i exakt den här formen: {"text":"…"}',
      user: `UNDERLAG:
${underlagText(data?.underlag)}

Svara med JSON:`,
      maxTokens: 900,
      reasoningEffort: 'low',
      parseJson: true,
      responseKey: 'namndtext'
    };
  },

  // AIX21 (2026-10-30): aktivitetsförslag ur organisationens egen katalog. Prompten
  // får katalogposterna under korta id:n och får bara svara med dem; validatorn
  // (_aktivitetsforslag.js) förkastar varje okänt id. Svarsformen är en lista av
  // platta objekt, aldrig [[…]] (modellen tappar sista ]). Målet är konsulentens
  // egen formulering och pseudonymiseras av callAI före anropet.
  'konsulent-aktivitetsforslag': (data) => {
    const poster = katalogRader(data?.katalog);
    const mal = typeof data?.mal === 'string' ? data.mal.trim().slice(0, MAL_MAX) : '';
    return {
      system: 'Du hjälper en arbetskonsulent att välja aktiviteter åt en deltagare. Du får deltagarens mål, skrivet av konsulenten, och en lista över kommunens egna aktiviteter, var och en med ett kort id. Välj tre till fyra aktiviteter ur listan som tydligt passar målet. Passar färre än tre, välj färre; passar ingen, svara med en tom lista. Svara BARA med id:n ur listan, aldrig med en aktivitet som inte står där. Skriv en motivering på en mening (högst 25 ord) per aktivitet som kopplar den till något som står i målet. Hitta aldrig på innehåll, tider, platser eller siffror som inte står i listan eller i målet. Gissa inte om deltagarens hälsa eller bakgrund. Svara ENDAST med JSON, ingen annan text, i exakt den här formen: {"forslag":[{"id":"a1","motivering":"…"}]}',
      user: `MÅL:
${mal || 'Inget mål angivet.'}

AKTIVITETER:
${poster.map(postText).join('\n') || 'Inga aktiviteter.'}

Svara med JSON:`,
      maxTokens: 700,
      reasoningEffort: 'low',
      parseJson: true,
      responseKey: 'aktivitetsforslag'
    };
  },
};
