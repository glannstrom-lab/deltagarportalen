#!/usr/bin/env node
/**
 * AIX26 — språkmätning. 30 fasta svenska meningar översätts till varje
 * målspråk och tillbaka till svenska med openai/gpt-oss-120b (OpenRouter).
 * Bara de fasta meningarna skickas — aldrig användardata.
 *
 *   node scripts/sprakmatning.cjs                 # alla språk, markdown till stdout
 *   node scripts/sprakmatning.cjs --sprak=ar,so   # urval
 *   node scripts/sprakmatning.cjs --ut=fil.md --json=fil.json
 *   node scripts/sprakmatning.cjs --torr          # bara antal anrop
 *   node scripts/sprakmatning.cjs --skydda        # mekaniskt namnskydd (platshållare)
 *   node scripts/sprakmatning.cjs --fran-json=fil.json   # poängsätt om sparade svar, inga anrop
 *
 * Nyckeln OPENROUTER_API_KEY läses ur client/.env.production.local (eller
 * miljön) och skrivs aldrig ut. Modellen är låst (docs/AI_MODEL_LOCKING.md).
 * 30 meningar x 2 riktningar = 60 anrop per språk.
 */
const fs = require('node:fs');
const path = require('node:path');
const {
  bedomMening, sammanfatta, samsta, skyddaNamn, aterstallNamn, KVOT_MIN, KVOT_MAX, LIKHET_MIN,
} = require('./lib/sprakmatning.cjs');

const MODELL = 'openai/gpt-oss-120b';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Källor: ROADMAP O18 (Jobskills sex språk: arabiska, persiska, somaliska,
// tigrinja, engelska, svenska) och KM11 (arabiska/somaliska/tigrinja/dari).
const SPRAK = [
  { kod: 'ar', namn: 'arabiska' },
  { kod: 'fa', namn: 'persiska (farsi)' },
  { kod: 'prs', namn: 'dari (afghansk persiska)' },
  { kod: 'so', namn: 'somaliska' },
  { kod: 'ti', namn: 'tigrinja' },
  { kod: 'en', namn: 'engelska' },
];

const MENINGAR = [
  'Du är kallad till ett möte på Arbetsförmedlingen den 12 november klockan 10:30.',
  'Försäkringskassan har fattat ett beslut om din sjukpenning, och du kan överklaga inom 3 veckor.',
  'Din a-kassa betalar ut ersättning först när du har skickat in ditt kassakort.',
  'Vi har 14 dagar på oss att handlägga din ansökan om bostadsbidrag.',
  'Ta med ditt ID-kort och ditt personnummer till mötet på Migrationsverket.',
  'Skatteverket har skickat ett brev om din deklaration för 2025, som ska vara inne senast den 2 maj.',
  'Du har rätt till 80 procent av din tidigare lön, men högst 1 200 kronor per dag.',
  'Din handläggare heter Anna Lindqvist och nås på telefon 010-123 45 67 vardagar mellan 8 och 16.',
  'Du måste söka minst 6 jobb varje månad för att behålla din ersättning.',
  'Om du inte kan komma till mötet ska du avboka senast klockan 15:00 dagen innan.',
  'CSN betalar ut ditt studiemedel den 25:e varje månad, 4 200 kronor i bidrag och 7 100 kronor i lån.',
  'Din ansökan om Bolagsverkets registrering av enskild firma kostar 900 kronor.',
  'Skriv en kort presentation överst i ditt CV, högst 4 meningar.',
  'Jag har arbetat som lagerarbetare i 5 år och har truckkort sedan 2021.',
  'I ditt CV ska du ange arbetsgivare, titel och år, till exempel Lagerjobb AB, 2019 till 2024.',
  'Bifoga ett personligt brev där du förklarar varför du passar för tjänsten som städare.',
  'Intervjun börjar klockan 9:00 och pågår i ungefär 45 minuter.',
  'Berätta om en gång då du löste ett problem tillsammans med en kollega.',
  'Du får inte frågor om din ålder, din religion eller om du planerar att skaffa barn.',
  'Efter intervjun får du besked inom 2 veckor, antingen per telefon eller via e-post.',
  'Du kan läsa mer om dina rättigheter på Arbetsförmedlingens webbplats.',
  'Din plan gäller från den 1 december och följs upp varje vecka.',
  'Om du mår dåligt kan du ringa Jourhavande medmänniska på 08-702 16 80, varje natt klockan 21 till 06.',
  'Komvux erbjuder gratis kurser i svenska, matematik och engelska, och terminen startar den 20 januari.',
  'Yrkeshögskolan har utbildningar på 1 till 3 år, och sista ansökningsdag är den 15 april.',
  'Folkbokföring sker hos Skatteverket, och du behöver ett svenskt personnummer eller samordningsnummer för att öppna bankkonto.',
  'Logga in med BankID för att se dina handlingar, så slipper du vänta på posten.',
  'Din hyra är 6 450 kronor i månaden och ska vara betald senast den sista varje månad.',
  'Praktiken omfattar 20 timmar i veckan under 8 veckor, och du får ingen lön under tiden.',
  'Vi kan inte lova att du får jobbet, men vi hjälper dig att söka och att förbereda dig.',
];

const SKYDDADE = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n', 'skyddadeNamn.json'), 'utf8'),
);
const NAMN = SKYDDADE.namn;
const BOJNINGAR = SKYDDADE.bojningar || [];

function lasNyckel() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const f = path.join(__dirname, '..', '.env.production.local');
  const rad = fs.readFileSync(f, 'utf8').split(/\r?\n/).find((r) => r.startsWith('OPENROUTER_API_KEY='));
  if (!rad) throw new Error('OPENROUTER_API_KEY saknas i .env.production.local');
  return rad.slice('OPENROUTER_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
}

let anrop = 0;
async function fraga(nyckel, system, user) {
  let senaste = '';
  for (let forsok = 0; forsok < 2; forsok++) {
    anrop++;
    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${nyckel}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://www.jobin.se',
          'X-Title': 'Jobin sprakmatning',
        },
        body: JSON.stringify({
          model: MODELL,
          temperature: 0,
          max_tokens: 2000,
          reasoning: { effort: 'low' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (typeof text !== 'string') throw new Error('inget content');
      return { text: text.trim() };
    } catch (e) {
      senaste = e.message;
    }
  }
  return { fel: senaste };
}

const SYS = 'Du är en översättare. Svara ENBART med översättningen av texten, utan förklaring, citattecken eller anteckningar. Behåll alla siffror, datum och klockslag exakt.';
const NAMNREGEL = `Svenska myndighetsnamn och begrepp översätts ALDRIG utan skrivs kvar på svenska exakt som här: ${NAMN.join(', ')}.`;

const PLATSHALLARREGEL = 'Texten innehåller platshållare som ⟦N1⟧, ⟦N2⟧. Kopiera varje platshållare oförändrad, exakt som den står (med tecknen ⟦ och ⟧ och siffran), på rätt plats i meningen. Översätt dem aldrig och ändra aldrig siffran.';

async function kor(sprak, nyckel, skydda) {
  const ut = [];
  for (const original of MENINGAR) {
    // Med --skydda byts namnen mot platshållare före översättningen och sätts tillbaka efter.
    const sk = skydda ? skyddaNamn(original, NAMN, BOJNINGAR) : null;
    const indata = sk ? sk.text : original;
    const system = skydda ? `${SYS} ${PLATSHALLARREGEL}` : `${SYS} ${NAMNREGEL}`;
    const a = await fraga(nyckel, system, `Översätt från svenska till ${sprak.namn}:\n\n${indata}`);
    let mal = a.fel ? '' : a.text;
    let skydd = null;
    if (sk && !a.fel) {
      const t = aterstallNamn(a.text, sk.platshallare);
      mal = t.text;
      skydd = { antal: sk.platshallare.length, saknade: t.saknade, forvanskade: t.forvanskade, dubblerade: t.dubblerade, normaliserade: t.normaliserade, ok: t.ok };
    }
    const b = a.fel ? { fel: 'hoppad' } : await fraga(nyckel, SYS, `Översätt från ${sprak.namn} till svenska:\n\n${mal}`);
    const fel = Boolean(a.fel || b.fel);
    ut.push({ original, mal: fel ? '' : mal, tillbaka: fel ? '' : b.text, fel, ...(skydd ? { skydd } : {}) });
  }
  return ut;
}

const pct = (x) => `${(x * 100).toFixed(0)} %`;

function markdown(resultat) {
  const rader = [
    '| Språk | Godkända | Tal i målspråk | Tal tillbaka | Namn kvar | Likhet | Längdkvot | Poäng | Tomma | Kopior | Längdfel |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const { sprak, bedomda } of resultat) {
    const s = sammanfatta(bedomda);
    rader.push(`| ${sprak.namn} (${sprak.kod}) | ${s.godkanda}/${s.antal} | ${pct(s.talMal)} | ${pct(s.talTill)} | ${pct(s.namn)} | ${s.likhet.toFixed(2)} | ${s.kvot.toFixed(2)} | ${s.poang.toFixed(2)} | ${s.tomma} | ${s.kopior} | ${s.langdfel} |`);
  }
  const delar = [rader.join('\n')];
  for (const { sprak, bedomda } of resultat) {
    const med = bedomda.filter((b) => b.skydd);
    if (!med.length) continue;
    const summa = (f) => med.reduce((n, b) => n + f(b.skydd), 0);
    delar.push(`\nNamnskydd ${sprak.namn}: ${summa((s) => s.antal)} platshållare, ${summa((s) => s.saknade.length)} tappade, ${summa((s) => s.forvanskade.length)} förvanskade, ${summa((s) => s.normaliserade)} återställda trots avvikande skrivsätt.`);
  }
  const c = (t) => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  for (const { sprak, bedomda } of resultat) {
    delar.push(`\n#### ${sprak.namn} — de tio sämsta\n`);
    delar.push('| # | Original | På språket | Tillbaka | Poäng | Skäl |\n|---|---|---|---|---|---|');
    samsta(bedomda, 10).forEach((b, i) => {
      delar.push(`| ${i + 1} | ${c(b.original)} | ${c(b.mal)} | ${c(b.tillbaka)} | ${b.poang.toFixed(2)} | ${b.skal.join('; ') || '—'} |`);
    });
  }
  return delar.join('\n');
}

async function main() {
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
  const urval = arg('sprak') ? arg('sprak').split(',') : SPRAK.map((s) => s.kod);
  const sprakLista = SPRAK.filter((s) => urval.includes(s.kod));
  if (process.argv.includes('--torr')) {
    console.log(`${MENINGAR.length} meningar, ${sprakLista.length} språk, högst ${MENINGAR.length * 2 * sprakLista.length} anrop (+ omförsök).`);
    return;
  }
  const skydda = process.argv.includes('--skydda');
  const resultat = [];
  if (arg('fran-json')) {
    // Poängsätt om redan hämtade svar — inga modellanrop.
    for (const r of JSON.parse(fs.readFileSync(arg('fran-json'), 'utf8'))) {
      resultat.push({ sprak: r.sprak, bedomda: r.bedomda.map((b) => ({ ...bedomMening(b, NAMN), original: b.original, mal: b.mal, tillbaka: b.tillbaka, fel: b.fel, skydd: b.skydd })) });
    }
    const md0 = `<!-- trösklar: längdkvot ${KVOT_MIN}–${KVOT_MAX}, likhet >= ${LIKHET_MIN} -->
${markdown(resultat)}
`;
    if (arg('ut')) fs.writeFileSync(arg('ut'), md0); else process.stdout.write(md0);
    return;
  }
  const nyckel = lasNyckel();
  for (const sprak of sprakLista) {
    console.error(`[${sprak.kod}] startar (anrop hittills: ${anrop})`);
    const ra = await kor(sprak, nyckel, skydda);
    resultat.push({ sprak, bedomda: ra.map((r) => ({ ...bedomMening(r, NAMN), ...r })) });
  }
  console.error(`Klart. Modellanrop inklusive omförsök: ${anrop}`);
  const md = `<!-- trösklar: längdkvot ${KVOT_MIN}–${KVOT_MAX}, likhet >= ${LIKHET_MIN} -->\n${markdown(resultat)}\n`;
  if (arg('ut')) fs.writeFileSync(arg('ut'), md); else process.stdout.write(md);
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(resultat, null, 1));
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
