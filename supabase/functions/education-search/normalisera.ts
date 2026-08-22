// Ren normalisering av JobEd Connects svar. INGA Deno-beroenden, inga
// nätanrop — allt här är rena funktioner av in-JSON till ut-JSON.
//
// Utbruten ur index.ts 2026-08-22 för att den ska gå att TESTA. Fram till dess
// fanns 2 304 tester i projektet och inte ett enda kunde falla på den här
// koden: ett mutationsstickprov bytte ut edge-funktionens namn mot en funktion
// som inte finns och hela sviten förblev grön. De fem felen som lagades samma
// dag — objekt som label, långa formkoder, url som objekt, "YH-poäng" på en
// komvuxkurs, kommunkod som ortnamn — hade alla fångats av ett kontraktstest.
//
// Testerna ligger i client/src/services/__tests__/utbildning-normalisering.test.ts.

// Types
export interface SearchParams {
  q?: string;
  type?: string;        // vår förenklade typ: yrkeshogskola, hogskola, komvux, folkhogskola
  form?: string;        // JobEds egen kortkod, om anroparen vet vad den gör
  region?: string;      // region_code (2 siffror)
  municipality?: string; // municipality_code (4 siffror)
  distance?: boolean;
  limit?: number;
  offset?: number;
}

export interface Education {
  id: string;
  title: string;
  provider: string;
  providerUrl?: string;
  type: string;
  typeLabel: string;
  form?: string;
  formLabel?: string;
  description?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  /** Alla orter utbildningen ges på. Samma kurs listas en gång per kommun
   *  hos JobEd; vi slår ihop dem till ett kort och räknar upp orterna. */
  locations?: string[];
  municipality?: string;
  region?: string;
  pace?: string;
  pacePercent?: number;
  distance?: boolean;
  url?: string;
  /** Poängen MED sin enhet — "400 YH-poäng", "180 hp", "1900 poäng".
   *  Ett naket tal går inte att jämföra mellan utbildningsformer. */
  creditsLabel?: string;
  level?: string;
}

export interface SearchResult {
  educations: Education[];
  total: number;
  hasMore: boolean;
  /** `'error'` betyder att anropet föll — INTE att det saknas utbildningar.
   *  Den som ritar listan måste skilja på de två. */
  source: string;
  /** Antal kurstillfällen som slogs ihop bort ur den här sidan. Gör att
   *  klienten kan säga sanningen om vad räknaren står för. */
  merged?: number;
  /** Yrket JobEd tolkade fritexten som. */
  matchedOccupation?: string;
}

// ── Utbildningsformer ────────────────────────────────────────────────────
// EN tabell, nycklad på JobEds KORTA koder. Tidigare fanns två: FORM_LABELS
// med långa nycklar (matchade aldrig något) och MATCH_FORM_LABELS med korta
// (matchade bara matchvägen). Sökvägen visade därför råkoden "vuxgy" i badgen.
// Källa: GET /searchparameters/education_forms, mätt 2026-08-22.
export const FORMER: Record<string, { etikett: string; typ: string }> = {
  'yh': { etikett: 'Yrkeshögskola', typ: 'yrkeshogskola' },
  'hs': { etikett: 'Högskola/universitet', typ: 'hogskola' },
  'vuxgy': { etikett: 'Komvux, gymnasial', typ: 'komvux' },
  'vuxgr': { etikett: 'Komvux, grundläggande', typ: 'komvux' },
  'fhs': { etikett: 'Folkhögskola', typ: 'folkhogskola' },
  'fhsk': { etikett: 'Folkhögskola', typ: 'folkhogskola' },
  'kku': { etikett: 'Konst- och kulturutbildning', typ: 'kku' },
  'af arbetsmarknadsutbildning': { etikett: 'Arbetsmarknadsutbildning', typ: 'arbetsmarknadsutbildning' },
};

// Vår förenklade typ → JobEds kortkod(er). Det här är filtret som gav noll
// träffar i drift: värdena var 'yrkeshögskoleutbildning' m.fl., som API:t
// inte känner igen.
export const TYP_TILL_FORM: Record<string, string[]> = {
  'yrkeshogskola': ['yh'],
  'hogskola': ['hs'],
  'universitet': ['hs'],
  'komvux': ['vuxgy', 'vuxgr'],
  'folkhogskola': ['fhs'],
  'arbetsmarknadsutbildning': ['af arbetsmarknadsutbildning'],
  'kku': ['kku'],
};

// Poängsystem → enhet. 1900 "YH-poäng" om en komvuxkurs är 1900
// gymnasiepoäng var det gamla svaret; det motsvarar ~63 års högskolestudier.
export const POANGENHET: Record<string, string> = {
  'yh': 'YH-poäng',
  'hp': 'hp',
  'vp': 'poäng',
};

// Kommunkod → namn. JobEd svarar med SCB-koder ("2518"), och kortet ritar en
// kartnål framför dem. Hämtad från GET /searchparameters/municipalities
// 2026-08-22 (219 kommuner förekommer i utbildningsregistret).
export const KOMMUNNAMN: Record<string, string> = {
  '0114':'Upplands Väsby', '0115':'Vallentuna', '0117':'Österåker', '0120':'Värmdö',
  '0123':'Järfälla', '0125':'Ekerö', '0126':'Huddinge', '0127':'Botkyrka', '0136':'Haninge',
  '0138':'Tyresö', '0139':'Upplands-Bro', '0140':'Nykvarn', '0160':'Täby', '0162':'Danderyd',
  '0163':'Sollentuna', '0180':'Stockholm', '0181':'Södertälje', '0182':'Nacka', '0183':'Sundbyberg',
  '0184':'Solna', '0186':'Lidingö', '0187':'Vaxholm', '0188':'Norrtälje', '0191':'Sigtuna',
  '0192':'Nynäshamn', '0305':'Håbo', '0360':'Tierp', '0380':'Uppsala', '0381':'Enköping',
  '0382':'Östhammar', '0480':'Nyköping', '0481':'Oxelösund', '0482':'Flen', '0483':'Katrineholm',
  '0484':'Eskilstuna', '0488':'Trosa', '0580':'Linköping', '0581':'Norrköping', '0583':'Motala',
  '0584':'Vadstena', '0586':'Mjölby', '0642':'Mullsjö', '0643':'Habo', '0662':'Gislaved',
  '0680':'Jönköping', '0682':'Nässjö', '0683':'Värnamo', '0685':'Vetlanda', '0686':'Eksjö',
  '0687':'Tranås', '0760':'Uppvidinge', '0764':'Alvesta', '0765':'Älmhult', '0767':'Markaryd',
  '0780':'Växjö', '0781':'Ljungby', '0840':'Mörbylånga', '0860':'Hultsfred', '0862':'Emmaboda',
  '0880':'Kalmar', '0881':'Nybro', '0882':'Oskarshamn', '0883':'Västervik', '0884':'Vimmerby',
  '0980':'Gotland', '1060':'Olofström', '1080':'Karlskrona', '1081':'Ronneby', '1082':'Karlshamn',
  '1083':'Sölvesborg', '1214':'Svalöv', '1230':'Staffanstorp', '1231':'Burlöv', '1233':'Vellinge',
  '1256':'Östra Göinge', '1260':'Bjuv', '1262':'Lomma', '1263':'Svedala', '1264':'Skurup',
  '1265':'Sjöbo', '1266':'Hörby', '1267':'Höör', '1270':'Tomelilla', '1273':'Osby', '1275':'Perstorp',
  '1276':'Klippan', '1278':'Båstad', '1280':'Malmö', '1281':'Lund', '1282':'Landskrona',
  '1283':'Helsingborg', '1285':'Eslöv', '1286':'Ystad', '1287':'Trelleborg', '1290':'Kristianstad',
  '1291':'Simrishamn', '1292':'Ängelholm', '1293':'Hässleholm', '1380':'Halmstad',
  '1382':'Falkenberg', '1383':'Varberg', '1384':'Kungsbacka', '1401':'Härryda', '1402':'Partille',
  '1415':'Stenungsund', '1419':'Tjörn', '1421':'Orust', '1435':'Tanum', '1439':'Färgelanda',
  '1441':'Lerum', '1444':'Grästorp', '1460':'Bengtsfors', '1463':'Mark', '1465':'Svenljunga',
  '1470':'Vara', '1471':'Götene', '1472':'Tibro', '1480':'Göteborg', '1481':'Mölndal',
  '1482':'Kungälv', '1484':'Lysekil', '1485':'Uddevalla', '1486':'Strömstad', '1487':'Vänersborg',
  '1488':'Trollhättan', '1489':'Alingsås', '1490':'Borås', '1491':'Ulricehamn', '1492':'Åmål',
  '1493':'Mariestad', '1494':'Lidköping', '1495':'Skara', '1496':'Skövde', '1497':'Hjo',
  '1498':'Tidaholm', '1499':'Falköping', '1737':'Torsby', '1761':'Hammarö', '1762':'Munkfors',
  '1763':'Forshaga', '1765':'Årjäng', '1766':'Sunne', '1780':'Karlstad', '1781':'Kristinehamn',
  '1782':'Filipstad', '1783':'Hagfors', '1784':'Arvika', '1785':'Säffle', '1861':'Hallsberg',
  '1863':'Hällefors', '1880':'Örebro', '1882':'Askersund', '1883':'Karlskoga', '1885':'Lindesberg',
  '1904':'Skinnskatteberg', '1961':'Hallstahammar', '1962':'Norberg', '1980':'Västerås',
  '1981':'Sala', '1982':'Fagersta', '1983':'Köping', '1984':'Arboga', '2021':'Vansbro',
  '2023':'Malung-Sälen', '2026':'Gagnef', '2029':'Leksand', '2031':'Rättvik', '2039':'Älvdalen',
  '2061':'Smedjebacken', '2062':'Mora', '2080':'Falun', '2081':'Borlänge', '2084':'Avesta',
  '2085':'Ludvika', '2101':'Ockelbo', '2132':'Nordanstig', '2161':'Ljusdal', '2180':'Gävle',
  '2181':'Sandviken', '2182':'Söderhamn', '2183':'Bollnäs', '2184':'Hudiksvall', '2260':'Ånge',
  '2262':'Timrå', '2280':'Härnösand', '2281':'Sundsvall', '2282':'Kramfors', '2283':'Sollefteå',
  '2284':'Örnsköldsvik', '2303':'Ragunda', '2305':'Bräcke', '2309':'Krokom', '2313':'Strömsund',
  '2321':'Åre', '2326':'Berg', '2361':'Härjedalen', '2380':'Östersund', '2404':'Vindeln',
  '2409':'Robertsfors', '2421':'Storuman', '2460':'Vännäs', '2462':'Vilhelmina', '2480':'Umeå',
  '2481':'Lycksele', '2482':'Skellefteå', '2505':'Arvidsjaur', '2506':'Arjeplog', '2510':'Jokkmokk',
  '2513':'Överkalix', '2514':'Kalix', '2518':'Övertorneå', '2521':'Pajala', '2523':'Gällivare',
  '2560':'Älvsbyn', '2580':'Luleå', '2581':'Piteå', '2582':'Boden', '2583':'Haparanda',
  '2584':'Kiruna',
};

export const LANSNAMN: Record<string, string> = {
  '01':'Stockholms län', '03':'Uppsala län', '04':'Södermanlands län', '05':'Östergötlands län',
  '06':'Jönköpings län', '07':'Kronobergs län', '08':'Kalmar län', '09':'Gotlands län',
  '10':'Blekinge län', '12':'Skåne län', '13':'Hallands län', '14':'Västra Götalands län',
  '17':'Värmlands län', '18':'Örebro län', '19':'Västmanlands län', '20':'Dalarnas län',
  '21':'Gävleborgs län', '22':'Västernorrlands län', '23':'Jämtlands län', '24':'Västerbottens län',
  '25':'Norrbottens län',
};

// ── Hjälpare ─────────────────────────────────────────────────────────────

/** JobEd svarar med `[{lang, content}]` på flera fält — och ibland med ett
 *  ensamt objekt. Båda formerna ska ge en sträng, aldrig ett objekt vidare. */
export function svenskText(varde: unknown): string {
  if (!varde) return '';
  if (typeof varde === 'string') return varde;
  if (Array.isArray(varde)) {
    const sve = varde.find((i: any) => i?.lang === 'swe' || i?.lang === 'sv');
    const vald = sve ?? varde[0];
    return typeof vald === 'string' ? vald : (vald?.content ?? '');
  }
  const obj = varde as any;
  return typeof obj.content === 'string' ? obj.content : '';
}

/** Anordnarnas beskrivningar är HTML. `line-clamp-2` visade tidigare två
 *  rader som började med "<p>" och innehöll "&nbsp;". */
export function rensaHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Anordnarens beskrivning inleds ofta med utbildningens namn igen — ibland
 *  är den bara namnet. Kortet visar då titeln två gånger, och `line-clamp-2`
 *  äter upp de rader som skulle ha sagt något nytt. */
export function utanTitelupprepning(beskrivning: string, titel: string): string {
  const b = beskrivning.trim();
  const t = titel.trim();
  if (!b || !t) return b;
  if (b.toLowerCase() === t.toLowerCase()) return '';
  if (b.toLowerCase().startsWith(t.toLowerCase())) {
    return b.slice(t.length).replace(/^[\s.,:;–—-]+/, '').trim();
  }
  return b;
}

/** Bara http(s) släpps vidare — och bara som sträng. */
export function sakerUrl(varde: unknown): string | undefined {
  const s = svenskText(varde);
  if (!s) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

/** Komvuxposterna saknar kommunkod men har kommunens NAMN i `provider`
 *  ("Nykvarn", "Botkyrka", "Vallentuna"). Kortet visade därför ingen ort
 *  alls fast orten stod mitt på det, under fel etikett. */
export const KOMMUNSET = new Set(Object.values(KOMMUNNAMN));

export function orterFor(event: any, provider?: string): string[] {
  const koder: string[] = Array.isArray(event?.municipalityCode) ? event.municipalityCode : [];
  const namn = koder.map((k) => KOMMUNNAMN[k]).filter(Boolean) as string[];
  if (namn.length) return [...new Set(namn)];
  if (provider && KOMMUNSET.has(provider)) return [provider];
  const lan: string[] = Array.isArray(event?.regionCode) ? event.regionCode : [];
  const lanNamn = lan.map((k) => LANSNAMN[k]).filter(Boolean) as string[];
  if (lanNamn.length) return [...new Set(lanNamn)];
  return [];
}

/** Längd i klartext ur start-/slutdatum. Fältet `duration` bar tidigare
 *  poängtalet ("1900 YH-poäng") bakom en klockikon — poäng är inte tid. */
export function langd(start?: string | null, slut?: string | null): string | undefined {
  if (!start || !slut) return undefined;
  const s = new Date(start);
  const e = new Date(slut);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return undefined;
  const manader = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (manader < 1) return 'Under en månad';
  if (manader === 1) return '1 månad';
  if (manader < 12) return `${manader} månader`;
  const ar = Math.round((manader / 12) * 10) / 10;
  return ar === 1 ? '1 år' : `${String(ar).replace('.', ',')} år`;
}

export function poangEtikett(credits: any, formKod: string): string | undefined {
  const antal = credits?.credits ?? credits?.value;
  if (typeof antal !== 'number' || antal <= 0) return undefined;
  const system = credits?.system?.code;
  const enhet = POANGENHET[system] ?? (formKod === 'yh' ? 'YH-poäng' : 'poäng');
  return `${antal} ${enhet}`;
}

// ── Normalisering ────────────────────────────────────────────────────────

// JobEd Connect returnerar {id, education: {...}, providerSummary, eventSummary}
export function normalizeEducation(raw: any): Education {
  const edu = raw.education || raw;
  const event = raw.eventSummary || {};
  const providerInfo = raw.providerSummary || {};

  const formKod = String(edu.form?.code || raw.education_form || '').toLowerCase();
  const form = FORMER[formKod];

  const execution = event.executions?.[0] || {};
  const pacePercent = event.paceOfStudyPercentage?.[0] ?? null;
  const provider = providerInfo.providers?.[0] || svenskText(edu.provider?.label) || '';
  const orter = orterFor(event, provider);

  const titel = svenskText(edu.title) || raw.label || 'Namnlös utbildning';

  return {
    id: raw.id || edu.identifier || edu.code || '',
    title: titel,
    provider,
    providerUrl: sakerUrl(edu.urls),
    // Okänd form → 'other' + neutral etikett. Visa aldrig råkoden.
    type: form?.typ || 'other',
    typeLabel: form?.etikett || 'Utbildning',
    form: formKod || undefined,
    formLabel: form?.etikett || undefined,
    description: utanTitelupprepning(rensaHtml(svenskText(edu.description)), titel).slice(0, 400) || undefined,
    duration: langd(execution.start, execution.end),
    startDate: execution.start || undefined,
    endDate: execution.end || undefined,
    location: event.distance === true && !orter.length ? 'Distans' : (orter[0] || undefined),
    locations: orter.length ? orter : undefined,
    municipality: event.municipalityCode?.[0] || undefined,
    region: event.regionCode?.[0] || undefined,
    pace: pacePercent ? `${pacePercent}%` : undefined,
    pacePercent: pacePercent ?? undefined,
    distance: event.distance === true,
    url: sakerUrl(edu.urls),
    creditsLabel: poangEtikett(edu.credits, formKod),
    level: edu.educationLevel?.code || undefined,
  };
}

// Träffarna från match-by-jobtitle har en HELT ANNAN form än sökträffarna:
// platta `education_title`/`education_provider_name`/`education_form` i
// stället för det nästlade `{education: {...}}`.
export function normalizeMatchHit(raw: any): Education {
  const event = raw.eventSummary || {};
  const execution = event.executions?.[0] || {};
  const formKod = String(raw.education_form || '').toLowerCase();
  const form = FORMER[formKod];
  const pacePercent = event.paceOfStudyPercentage?.[0] ?? null;
  const provider = raw.providerSummary?.providers?.[0] || raw.education_provider_name || '';
  const orter = orterFor(event, provider);

  return {
    id: raw.id || raw.code || '',
    title: raw.education_title || 'Namnlös utbildning',
    provider,
    type: form?.typ || 'other',
    typeLabel: form?.etikett || 'Utbildning',
    form: formKod || undefined,
    formLabel: form?.etikett || undefined,
    description: utanTitelupprepning(
      rensaHtml(raw.education_description || ''),
      raw.education_title || ''
    ).slice(0, 400) || undefined,
    duration: langd(execution.start, execution.end),
    startDate: execution.start || undefined,
    endDate: execution.end || undefined,
    // Matchträffarna bär ingen adress alls (kontrollerat mot API:t
    // 2026-08-22: fälten är id, code, education_provider_name, expires,
    // education_title, education_type, education_form, providerSummary,
    // eventSummary). Ingen `url` sätts hellre än en påhittad.
    location: event.distance === true && !orter.length ? 'Distans' : (orter[0] || undefined),
    locations: orter.length ? orter : undefined,
    pace: pacePercent ? `${pacePercent}%` : undefined,
    pacePercent: pacePercent ?? undefined,
    distance: event.distance === true,
  };
}

/** Samma kurs listas en gång per kommun. En sida på 20 träffar innehöll
 *  9 unika utbildningar; resten var kopior med olika `provider` (=kommunnamn).
 *  Vi slår ihop dem och samlar orterna på ett kort. */
export function slaIhopDubbletter(lista: Education[]): { unika: Education[]; borttagna: number } {
  const karta = new Map<string, Education>();
  let borttagna = 0;

  for (const e of lista) {
    const nyckel = `${e.title.toLowerCase().trim()}|${e.form || ''}`;
    const fanns = karta.get(nyckel);
    if (!fanns) {
      karta.set(nyckel, { ...e, locations: e.locations ? [...e.locations] : undefined });
      continue;
    }
    borttagna++;
    const orter = new Set([...(fanns.locations || []), ...(e.locations || [])]);
    if (orter.size) {
      fanns.locations = [...orter];
      fanns.location = fanns.location && fanns.location !== 'Distans' ? fanns.location : [...orter][0];
    }
    if (!fanns.url && e.url) fanns.url = e.url;
    if (!fanns.description && e.description) fanns.description = e.description;
    if (!fanns.duration && e.duration) fanns.duration = e.duration;
    if (e.distance) fanns.distance = true;
  }

  return { unika: [...karta.values()], borttagna };
}


// ── Sökparametrar (typer och regioner) ───────────────────────────────────
//
// JobEd svarar `[{key, value}]` på båda endpointerna. Den gamla koden gjorde
// `item.id || item.code || item` — alla tre undefined, så `|| item` gav
// tillbaka HELA objektet som både id och label. React fick ett objekt som
// barn i <option> och kastade #31: hela utbildningssidan dog vid klick på
// "Filter". Verifierat i prod 2026-08-22 innan lagningen.

export interface Val { id: string; label: string }

/** Släpper bara igenom poster där både id och label är strängar. */
export function rensaVal(poster: Val[]): Val[] {
  return poster.filter(
    (p) => typeof p?.id === 'string' && typeof p?.label === 'string' && p.label.length > 0
  );
}

/** Etikett för FILTERVALET, som kan omfatta flera formkoder. `komvux` täcker
 *  både vuxgy och vuxgr; utan den här tabellen fick valet den första
 *  formkodens etikett i bokstavsordning ("Komvux, grundläggande"). */
export const TYP_ETIKETT: Record<string, string> = {
  yrkeshogskola: 'Yrkeshögskola',
  hogskola: 'Högskola/universitet',
  komvux: 'Komvux',
  folkhogskola: 'Folkhögskola',
  arbetsmarknadsutbildning: 'Arbetsmarknadsutbildning',
  kku: 'Konst- och kulturutbildning',
};

export const TYPER_FALLBACK: Val[] = [
  { id: 'all', label: 'Alla utbildningsformer' },
  { id: 'yrkeshogskola', label: 'Yrkeshögskola' },
  { id: 'hogskola', label: 'Högskola/universitet' },
  { id: 'komvux', label: 'Komvux' },
  { id: 'folkhogskola', label: 'Folkhögskola' },
];

/** JobEds `[{key, value}]` → `[{id, label}]` med VÅRA etiketter. API:ts egna
 *  värden är råkoden med versal ("Yh", "Fhs") och duger inte för en läsare. */
export function typerFranApi(data: unknown): Val[] | null {
  if (!Array.isArray(data) || !data.length) return null;
  const sedda = new Set<string>();
  const typer: Val[] = [{ id: 'all', label: 'Alla utbildningsformer' }];
  for (const item of data as Array<Record<string, unknown>>) {
    const kod = String(item?.key ?? item?.code ?? item?.id ?? '').toLowerCase();
    const form = FORMER[kod];
    if (!form || sedda.has(form.typ)) continue;
    sedda.add(form.typ);
    typer.push({ id: form.typ, label: TYP_ETIKETT[form.typ] ?? form.etikett });
  }
  return typer.length > 1 ? rensaVal(typer) : null;
}

export function regionerFranApi(data: unknown): Val[] | null {
  if (!Array.isArray(data) || !data.length) return null;
  const regioner: Val[] = [{ id: '', label: 'Hela Sverige' }];
  for (const item of data as Array<Record<string, unknown>>) {
    const kod = String(item?.key ?? item?.region_code ?? item?.code ?? item?.id ?? '');
    const namn = typeof item?.value === 'string' ? item.value : LANSNAMN[kod];
    if (!kod || !namn) continue;
    regioner.push({ id: kod, label: namn });
  }
  return regioner.length > 1 ? rensaVal(regioner) : null;
}

export const REGIONER_FALLBACK: Val[] = rensaVal([
  { id: '', label: 'Hela Sverige' },
  ...Object.entries(LANSNAMN).map(([id, label]) => ({ id, label })),
]);
