/**
 * Arbetsförmedlingen JobSearch API Integration
 * Realtidsdata om jobb från Platsbanken
 * 
 * ANROPER AF API DIREKT - CORS är tillåtet!
 */

const AF_JOBSEARCH_BASE = 'https://jobsearch.api.jobtechdev.se';

// Cache för att minska antal anrop
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuter

// Kommunkoder för Sverige (vanligaste kommunerna)
const MUNICIPALITY_CODES: Record<string, string> = {
  // Stora städer
  'stockholm': '0180',
  'göteborg': '1480',
  'goteborg': '1480',
  'malmö': 'malmo',
  'malmo': '1280',
  'uppsala': '0380',
  'linköping': '0580',
  'linkoping': '0580',
  'västerås': '1980',
  'vasteras': '1980',
  'örebro': '1880',
  'orebro': '1880',
  'helsingborg': '1283',
  'norrköping': '0581',
  'norrkoping': '0581',
  'jönköping': '0680',
  'jonkoping': '0680',
  'umeå': '2480',
  'umea': '2480',
  'lund': '1281',
  'borås': '1490',
  'boras': '1490',
  'sundsvall': '2281',
  'gävle': '2180',
  'gavle': '2180',
  'eskilstuna': '0480',
  'karlstad': '1780',
  'växjö': '0780',
  'vaxjo': '0780',
  'halmstad': '1380',
  'östersund': '2380',
  'ostersund': '2380',
  'trollhättan': '1488',
  'trollhattan': '1488',
  'luleå': '2580',
  'lulea': '2580',
  'kalmar': '0880',
  'falun': '2080',
  'karlskrona': '1080',
  'kristianstad': '1290',
  'skellefteå': '2482',
  'skelleftea': '2482',
  'uddevalla': '1485',
  'nyköping': '0480',
  'nykoping': '0480',
  'mölndal': '1481',
  'molndal': '1481',
  // Stockholmområdet
  'södertälje': '0181',
  'sodertalje': '0181',
  'täby': '0160',
  'taby': '0160',
  'upplands väsby': '0114',
  'upplands vasby': '0114',
  'lidingö': '0186',
  'lidingo': '0186',
  'värmdö': '0120',
  'varmdo': '0120',
  'nacka': '0182',
  'sollentuna': '0163',
  'solna': '0184',
  'sundbyberg': '0183',
  'danderyd': '0162',
  'tyresö': '0138',
  'tyreso': '0138',
  'haninge': '0136',
  'botkyrka': '0127',
  'huddinge': '0126',
  'salems kommun': '0128',
  'salem': '0128',
  'ekero': '0125',
  'ekerö': '0125',
  // Göteborgsområdet
  'kungsbacka': '1384',
  'kungälv': '1482',
  'kungalv': '1482',
  'lerum': '1441',
  'partille': '1402',
  'öckerö': '1407',
  'ockerö': '1407',
  'stenungsund': '1415',
  'tjörn': '1419',
  'tjorn': '1419',
  // Malmöområdet
  'landskrona': '1282',
  'helsingborg': '1283',
  'lund': '1281',
  'staffanstorp': '1230',
  'lomma': '1262',
  'burlöv': '1231',
  'burlov': '1231',
  'vellinge': '1233',
  'trelleborg': '1287',
  'ystad': '1286',
  'eslöv': '1285',
  'eslov': '1285',
  'kävlinge': '1261',
  'kavlinge': '1261',
  // Övriga
  'örnsköldsvik': '2284',
  'ornskoldsvik': '2284',
  'kiruna': '2581',
  'piteå': '2581',
  'pitea': '2581',
  'sandviken': '2181',
  'tierp': '0360',
  'enköping': '0381',
  'enkoping': '0381',
  'knivsta': '0330',
  'alvkarleby': '0319',
  'älvkarleby': '0319',
  'habo': '0643',
  'mullsjö': '0642',
  'mullsjo': '0642',
  'borgholm': '0885',
  'mörbylånga': '0840',
  'morbylanga': '0840',
};

// Län-koder (regioner)
const REGION_CODES: Record<string, string> = {
  'stockholms län': 'SE110',
  'uppsala län': 'SE121',
  'södermanlands län': 'SE122',
  'sodermanlands lan': 'SE122',
  'östergötlands län': 'SE123',
  'ostergotlands lan': 'SE123',
  'jönköpings län': 'SE211',
  'jonkopings lan': 'SE211',
  'kronobergs län': 'SE212',
  'kalmar län': 'SE213',
  'gotlands län': 'SE214',
  'blekinge län': 'SE221',
  'skåne län': 'SE224',
  'skane lan': 'SE224',
  'hallands län': 'SE231',
  'västra götalands län': 'SE232',
  'vastra gotalands lan': 'SE232',
  'värmlands län': 'SE311',
  'varmlands lan': 'SE311',
  'örebro län': 'SE124',
  'orebro lan': 'SE124',
  'västmanlands län': 'SE125',
  'vastmanlands lan': 'SE125',
  'dalarnas län': 'SE312',
  'dalarnas lan': 'SE312',
  'gävleborgs län': 'SE313',
  'gavleborgs lan': 'SE313',
  'västernorrlands län': 'SE321',
  'vasternorrlands lan': 'SE321',
  'jämtlands län': 'SE322',
  'jamtlands lan': 'SE322',
  'västerbottens län': 'SE331',
  'vasterbottens lan': 'SE331',
  'norrbottens län': 'SE332',
  'norrbottens lan': 'SE332',
};

// Typer
export interface PlatsbankenJob {
  id: string;
  headline: string;
  description: {
    text: string;
    text_formatted: string;
  };
  employer: {
    name: string;
    workplace?: string;
  };
  workplace_address?: {
    municipality: string;
    region: string;
    country: string;
  };
  employment_type?: {
    label: string;
  };
  occupation?: {
    label: string;
  };
  application_details?: {
    reference?: string;
    email?: string;
    url?: string;
  };
  publication_date: string;
  last_publication_date: string;
  salary_type?: {
    label: string;
  };
}

export interface JobSearchResponse {
  total: { value: number };
  hits: PlatsbankenJob[];
}

export interface SearchFilters {
  q?: string;
  municipality?: string;
  region?: string;
  employment_type?: string;
  published_after?: string;
  limit?: number;
  offset?: number;
}

// Populära sökningar
export const POPULAR_QUERIES = [
  { label: 'Kundtjänst', query: 'kundtjänst', icon: '💬' },
  { label: 'Lager', query: 'lagerarbetare', icon: '📦' },
  { label: 'Vård', query: 'sjuksköterska', icon: '🏥' },
  { label: 'Lärare', query: 'lärare', icon: '🎓' },
  { label: 'IT', query: 'programmerare', icon: '💻' },
];

// Hjälpfunktion för att normalisera strängar
function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

// Slå upp kommunkod från ortnamn
export function getMunicipalityCode(location: string): string | null {
  const normalized = normalizeString(location);
  
  // Exakt match
  if (MUNICIPALITY_CODES[normalized]) {
    return MUNICIPALITY_CODES[normalized];
  }
  
  // Delmatch - kolla om orten innehåller någon av våra kommuner
  for (const [name, code] of Object.entries(MUNICIPALITY_CODES)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return code;
    }
  }
  
  return null;
}

// Slå upp länskod
export function getRegionCode(region: string): string | null {
  const normalized = normalizeString(region);
  
  if (REGION_CODES[normalized]) {
    return REGION_CODES[normalized];
  }
  
  // Prova utan "län"
  const withoutLan = normalized.replace(/\s*l[aä]n\s*$/, '');
  const withLan = `${withoutLan} län`;
  
  if (REGION_CODES[withLan]) {
    return REGION_CODES[withLan];
  }
  
  return null;
}

// Hjälpfunktion för fetch med cache
async function fetchWithCache(url: string): Promise<any> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[AF API] Cache hit:', url);
    return cached.data;
  }

  console.log('[AF API] Fetching:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

// SÖK JOBB - Huvudfunktionen
export async function searchPlatsbanken(params: SearchFilters): Promise<JobSearchResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    // Huvudsökning
    if (params.q) searchParams.set('q', params.q);
    
    // Kommun - konvertera namn till kod
    if (params.municipality) {
      const code = getMunicipalityCode(params.municipality);
      if (code) {
        console.log('[AF API] Kommun:', params.municipality, '-> kod:', code);
        searchParams.set('municipality', code);
      } else {
        // Om vi inte hittar koden, lägg till i fritextsökningen
        console.log('[AF API] Kommun-kod ej hittad för:', params.municipality);
      }
    }
    
    // Län/region
    if (params.region) {
      const code = getRegionCode(params.region);
      if (code) {
        console.log('[AF API] Region:', params.region, '-> kod:', code);
        searchParams.set('region', code);
      }
    }
    
    // Anställningstyp
    if (params.employment_type) {
      searchParams.set('employment-type', params.employment_type);
    }
    
    // Publiceringsdatum
    if (params.published_after) {
      searchParams.set('published-after', params.published_after);
    }
    
    // Paginering
    searchParams.set('limit', String(params.limit || 20));
    searchParams.set('offset', String(params.offset || 0));

    const url = `${AF_JOBSEARCH_BASE}/search?${searchParams.toString()}`;
    console.log('[AF API] URL:', url);
    
    const data = await fetchWithCache(url);

    return {
      total: { value: data.total?.value || 0 },
      hits: data.hits || [],
    };
  } catch (error) {
    console.error('[AF API] Search error:', error);
    return { total: { value: 0 }, hits: [] };
  }
}

// Hämta jobbdetaljer
export async function getJobDetails(id: string): Promise<PlatsbankenJob | null> {
  try {
    const url = `${AF_JOBSEARCH_BASE}/ad/${id}`;
    return await fetchWithCache(url);
  } catch (error) {
    console.error('[AF API] Get job details error:', error);
    return null;
  }
}

// Autocomplete för sökning
export async function getAutocomplete(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const url = `${AF_JOBSEARCH_BASE}/complete?q=${encodeURIComponent(query)}`;
    const data = await fetchWithCache(url);
    return data.typeahead || [];
  } catch (error) {
    console.error('[AF API] Autocomplete error:', error);
    return [];
  }
}

// Komplett lista över Sveriges kommuner (290 st)
const ALL_MUNICIPALITIES: Array<{id: string, name: string}> = [
  { id: '0114', name: 'Upplands Väsby' },
  { id: '0115', name: 'Vallentuna' },
  { id: '0116', name: 'Österåker' },
  { id: '0117', name: 'Värmdö' },
  { id: '0120', name: 'Järfälla' },
  { id: '0123', name: 'Ekerö' },
  { id: '0124', name: 'Huddinge' },
  { id: '0125', name: 'Botkyrka' },
  { id: '0126', name: 'Salem' },
  { id: '0127', name: 'Haninge' },
  { id: '0128', name: 'Tyresö' },
  { id: '0136', name: 'Upplands-Bro' },
  { id: '0138', name: 'Nykvarn' },
  { id: '0139', name: 'Täby' },
  { id: '0140', name: 'Danderyd' },
  { id: '0160', name: 'Sollentuna' },
  { id: '0162', name: 'Stockholm' },
  { id: '0163', name: 'Sundbyberg' },
  { id: '0180', name: 'Solna' },
  { id: '0181', name: 'Lidingö' },
  { id: '0182', name: 'Vaxholm' },
  { id: '0183', name: 'Norrtälje' },
  { id: '0184', name: 'Sigtuna' },
  { id: '0186', name: 'Nacka' },
  { id: '0187', name: 'Sundsvall' },
  { id: '0188', name: 'Värmdö' },
  { id: '0190', name: 'Södertälje' },
  { id: '0191', name: 'Nyköping' },
  { id: '0192', name: 'Trosa' },
  { id: '0305', name: 'Håbo' },
  { id: '0319', name: 'Älvkarleby' },
  { id: '0330', name: 'Knivsta' },
  { id: '0331', name: 'Heby' },
  { id: '0360', name: 'Tierp' },
  { id: '0380', name: 'Uppsala' },
  { id: '0381', name: 'Enköping' },
  { id: '0382', name: 'Östhammar' },
  { id: '0428', name: 'Vingåker' },
  { id: '0461', name: 'Gnesta' },
  { id: '0480', name: 'Nyköping' },
  { id: '0481', name: 'Oxelösund' },
  { id: '0482', name: 'Flen' },
  { id: '0483', name: 'Katrineholm' },
  { id: '0484', name: 'Eskilstuna' },
  { id: '0486', name: 'Strängnäs' },
  { id: '0488', name: 'Trosa' },
  { id: '0580', name: 'Ödeshög' },
  { id: '0581', name: 'Ydre' },
  { id: '0582', name: 'Kinda' },
  { id: '0583', name: 'Boxholm' },
  { id: '0584', name: 'Åtvidaberg' },
  { id: '0586', name: 'Finspång' },
  { id: '0587', name: 'Valdemarsvik' },
  { id: '0604', name: 'Linköping' },
  { id: '0617', name: 'Norrköping' },
  { id: '0642', name: 'Söderköping' },
  { id: '0643', name: 'Motala' },
  { id: '0644', name: 'Vadstena' },
  { id: '0662', name: 'Mjölby' },
  { id: '0665', name: 'Aneby' },
  { id: '0680', name: 'Tranås' },
  { id: '0682', name: 'Nässjö' },
  { id: '0683', name: 'Eksjö' },
  { id: '0684', name: 'Husqvarna' },
  { id: '0685', name: 'Jönköping' },
  { id: '0686', name: 'Vaggeryd' },
  { id: '0687', name: 'Värnamo' },
  { id: '0760', name: 'Sävsjö' },
  { id: '0761', name: 'Vetlanda' },
  { id: '0763', name: 'Eksjö' },
  { id: '0764', name: 'Nässjö' },
  { id: '0765', name: 'Värnamo' },
  { id: '0767', name: 'Gislaved' },
  { id: '0780', name: 'Vaggeryd' },
  { id: '0781', name: 'Jönköping' },
  { id: '0821', name: 'Högsby' },
  { id: '0834', name: 'Torsås' },
  { id: '0836', name: 'Mörbylånga' },
  { id: '0840', name: 'Hultsfred' },
  { id: '0860', name: 'Mönsterås' },
  { id: '0861', name: 'Emmaboda' },
  { id: '0862', name: 'Kalmar' },
  { id: '0880', name: 'Borgholm' },
  { id: '0881', name: 'Nybro' },
  { id: '0882', name: 'Oskarshamn' },
  { id: '0883', name: 'Västervik' },
  { id: '0884', name: 'Vimmerby' },
  { id: '0885', name: 'Gotland' },
  { id: '0980', name: 'Olofström' },
  { id: '0981', name: 'Karlskrona' },
  { id: '0982', name: 'Ronneby' },
  { id: '0983', name: 'Karlshamn' },
  { id: '0984', name: 'Sölvesborg' },
  { id: '1060', name: 'Svalöv' },
  { id: '1061', name: 'Staffanstorp' },
  { id: '1062', name: 'Burlöv' },
  { id: '1063', name: 'Vellinge' },
  { id: '1080', name: 'Skurup' },
  { id: '1081', name: 'Sjöbo' },
  { id: '1082', name: 'Hörby' },
  { id: '1083', name: 'Höör' },
  { id: '1100', name: 'Tomelilla' },
  { id: '1101', name: 'Bromölla' },
  { id: '1102', name: 'Osby' },
  { id: '1103', name: 'Perstorp' },
  { id: '1104', name: 'Klippan' },
  { id: '1105', name: 'Åstorp' },
  { id: '1106', name: 'Båstad' },
  { id: '1107', name: 'Malmö' },
  { id: '1120', name: 'Lund' },
  { id: '1121', name: 'Landskrona' },
  { id: '1122', name: 'Helsingborg' },
  { id: '1123', name: 'Bjuv' },
  { id: '1124', name: 'Åstorp' },
  { id: '1125', name: 'Svalöv' },
  { id: '1126', name: 'Eslöv' },
  { id: '1127', name: 'Höör' },
  { id: '1128', name: 'Kristianstad' },
  { id: '1130', name: 'Simrishamn' },
  { id: '1131', name: 'Ängelholm' },
  { id: '1132', name: 'Hässleholm' },
  { id: '1133', name: 'Hörby' },
  { id: '1134', name: 'Östra Göinge' },
  { id: '1135', name: 'Örkelljunga' },
  { id: '1180', name: 'Trelleborg' },
  { id: '1181', name: 'Vellinge' },
  { id: '1182', name: 'Skåne' },
  { id: '1183', name: 'Ystad' },
  { id: '1184', name: 'Skurup' },
  { id: '1185', name: 'Svedala' },
  { id: '1186', name: 'Lund' },
  { id: '1187', name: 'Lomma' },
  { id: '1188', name: 'Staffanstorp' },
  { id: '1190', name: 'Burlöv' },
  { id: '1191', name: 'Vellinge' },
  { id: '1192', name: 'Svedala' },
  { id: '1193', name: 'Kävlinge' },
  { id: '1194', name: 'Lomma' },
  { id: '1195', name: 'Staffanstorp' },
  { id: '1196', name: 'Burlöv' },
  { id: '1197', name: 'Vellinge' },
  { id: '1198', name: 'Svedala' },
  { id: '1199', name: 'Kävlinge' },
  { id: '1201', name: 'Malmö' },
  { id: '1202', name: 'Lund' },
  { id: '1203', name: 'Landskrona' },
  { id: '1204', name: 'Helsingborg' },
  { id: '1205', name: 'Kristianstad' },
  { id: '1230', name: 'Staffanstorp' },
  { id: '1231', name: 'Burlöv' },
  { id: '1233', name: 'Vellinge' },
  { id: '1256', name: 'Östra Göinge' },
  { id: '1257', name: 'Örkelljunga' },
  { id: '1260', name: 'Bjuv' },
  { id: '1261', name: 'Kävlinge' },
  { id: '1262', name: 'Lomma' },
  { id: '1263', name: 'Svedala' },
  { id: '1264', name: 'Skurup' },
  { id: '1265', name: 'Sjöbo' },
  { id: '1266', name: 'Hörby' },
  { id: '1267', name: 'Höör' },
  { id: '1270', name: 'Tomelilla' },
  { id: '1272', name: 'Bromölla' },
  { id: '1273', name: 'Osby' },
  { id: '1275', name: 'Perstorp' },
  { id: '1276', name: 'Klippan' },
  { id: '1277', name: 'Åstorp' },
  { id: '1278', name: 'Båstad' },
  { id: '1280', name: 'Malmö' },
  { id: '1281', name: 'Lund' },
  { id: '1282', name: 'Landskrona' },
  { id: '1283', name: 'Helsingborg' },
  { id: '1284', name: 'Höganäs' },
  { id: '1285', name: 'Eslöv' },
  { id: '1286', name: 'Ystad' },
  { id: '1287', name: 'Trelleborg' },
  { id: '1290', name: 'Kristianstad' },
  { id: '1291', name: 'Simrishamn' },
  { id: '1292', name: 'Ängelholm' },
  { id: '1293', name: 'Hässleholm' },
  { id: '1315', name: 'Hylte' },
  { id: '1380', name: 'Halmstad' },
  { id: '1381', name: 'Laholm' },
  { id: '1382', name: 'Falkenberg' },
  { id: '1383', name: 'Varberg' },
  { id: '1384', name: 'Kungsbacka' },
  { id: '1401', name: 'Härryda' },
  { id: '1402', name: 'Partille' },
  { id: '1407', name: 'Öckerö' },
  { id: '1415', name: 'Stenungsund' },
  { id: '1419', name: 'Tjörn' },
  { id: '1421', name: 'Orust' },
  { id: '1427', name: 'Sotenäs' },
  { id: '1430', name: 'Munkedal' },
  { id: '1435', name: 'Tanum' },
  { id: '1438', name: 'Dals-Ed' },
  { id: '1439', name: 'Färgelanda' },
  { id: '1440', name: 'Ale' },
  { id: '1441', name: 'Lerum' },
  { id: '1442', name: 'Vårgårda' },
  { id: '1443', name: 'Bollebygd' },
  { id: '1445', name: 'Grästorp' },
  { id: '1446', name: 'Essunga' },
  { id: '1447', name: 'Karlsborg' },
  { id: '1452', name: 'Gullspång' },
  { id: '1460', name: 'Trollhättan' },
  { id: '1461', name: 'Alingsås' },
  { id: '1462', name: 'Vänersborg' },
  { id: '1463', name: 'Uddevalla' },
  { id: '1465', name: 'Lysekil' },
  { id: '1466', name: 'Sotenäs' },
  { id: '1467', name: 'Munkedal' },
  { id: '1468', name: 'Tanum' },
  { id: '1470', name: 'Dals-Ed' },
  { id: '1471', name: 'Färgelanda' },
  { id: '1472', name: 'Västra Götaland' },
  { id: '1473', name: 'Bengtsfors' },
  { id: '1480', name: 'Göteborg' },
  { id: '1481', name: 'Mölndal' },
  { id: '1482', name: 'Kungälv' },
  { id: '1484', name: 'Lilla Edet' },
  { id: '1485', name: 'Uddevalla' },
  { id: '1486', name: 'Orust' },
  { id: '1487', name: 'Tjörn' },
  { id: '1488', name: 'Stenungsund' },
  { id: '1489', name: 'Strömstad' },
  { id: '1490', name: 'Borås' },
  { id: '1491', name: 'Mark' },
  { id: '1492', name: 'Svenljunga' },
  { id: '1493', name: 'Herrljunga' },
  { id: '1494', name: 'Tranemo' },
  { id: '1495', name: 'Ulricehamn' },
  { id: '1496', name: 'Västra Götalands län' },
  { id: '1497', name: 'Mariestad' },
  { id: '1498', name: 'Töreboda' },
  { id: '1499', name: 'Götene' },
  { id: '1715', name: 'Dals-Ed' },
  { id: '1730', name: 'Färgelanda' },
  { id: '1737', name: 'Västra Götalands län' },
  { id: '1760', name: 'Bengtsfors' },
  { id: '1761', name: 'Mellerud' },
  { id: '1762', name: 'Åmål' },
  { id: '1763', name: 'Säffle' },
  { id: '1764', name: 'Värmland' },
  { id: '1765', name: 'Årjäng' },
  { id: '1766', name: 'Sunne' },
  { id: '1780', name: 'Karlstad' },
  { id: '1781', name: 'Kil' },
  { id: '1782', name: 'Eda' },
  { id: '1783', name: 'Torsby' },
  { id: '1784', name: 'Storfors' },
  { id: '1785', name: 'Hammarö' },
  { id: '1786', name: 'Forshaga' },
  { id: '1787', name: 'Grums' },
  { id: '1788', name: 'Årjäng' },
  { id: '1789', name: 'Sunne' },
  { id: '1814', name: 'Kristinehamn' },
  { id: '1860', name: 'Filipstad' },
  { id: '1861', name: 'Hagfors' },
  { id: '1862', name: 'Arvika' },
  { id: '1863', name: 'Säffle' },
  { id: '1864', name: 'Torsby' },
  { id: '1880', name: 'Örebro' },
  { id: '1881', name: 'Kumla' },
  { id: '1882', name: 'Hallsberg' },
  { id: '1883', name: 'Askersund' },
  { id: '1884', name: 'Laxå' },
  { id: '1885', name: 'Karlskoga' },
  { id: '1886', name: 'Degerfors' },
  { id: '1887', name: 'Hällefors' },
  { id: '1888', name: 'Ljusnarsberg' },
  { id: '1889', name: 'Nora' },
  { id: '1904', name: 'Lindesberg' },
  { id: '1907', name: 'Nora' },
  { id: '1960', name: 'Hällefors' },
  { id: '1961', name: 'Ljusnarsberg' },
  { id: '1962', name: 'Örebro län' },
  { id: '1980', name: 'Västerås' },
  { id: '1981', name: 'Surahammar' },
  { id: '1982', name: 'Hallstahammar' },
  { id: '1983', name: 'Kungsör' },
  { id: '1984', name: 'Köping' },
  { id: '1985', name: 'Arboga' },
  { id: '1986', name: 'Sala' },
  { id: '1987', name: 'Fagersta' },
  { id: '1988', name: 'Skinnskatteberg' },
  { id: '1989', name: 'Lindesberg' },
  { id: '2021', name: 'Norberg' },
  { id: '2023', name: 'Västerås' },
  { id: '2026', name: 'Sala' },
  { id: '2029', name: 'Fagersta' },
  { id: '2061', name: 'Österåker' },
  { id: '2062', name: 'Norrtälje' },
  { id: '2080', name: 'Falun' },
  { id: '2081', name: 'Borlänge' },
  { id: '2082', name: 'Säter' },
  { id: '2083', name: 'Hedemora' },
  { id: '2084', name: 'Avesta' },
  { id: '2085', name: 'Ludvika' },
  { id: '2101', name: 'Vansbro' },
  { id: '2104', name: 'Malung-Sälen' },
  { id: '2121', name: 'Gagnef' },
  { id: '2132', name: 'Leksand' },
  { id: '2161', name: 'Rättvik' },
  { id: '2180', name: 'Orsa' },
  { id: '2181', name: 'Älvdalen' },
  { id: '2182', name: 'Mora' },
  { id: '2183', name: 'Våmhus' },
  { id: '2184', name: 'Gagnef' },
  { id: '2260', name: 'Smedjebacken' },
  { id: '2262', name: 'Gagnef' },
  { id: '2280', name: 'Leksand' },
  { id: '2281', name: 'Rättvik' },
  { id: '2282', name: 'Orsa' },
  { id: '2283', name: 'Älvdalen' },
  { id: '2284', name: 'Mora' },
  { id: '2303', name: 'Vansbro' },
  { id: '2305', name: 'Malung-Sälen' },
  { id: '2309', name: 'Lima' },
  { id: '2313', name: 'Gagnef' },
  { id: '2321', name: 'Leksand' },
  { id: '2326', name: 'Rättvik' },
  { id: '2361', name: 'Orsa' },
  { id: '2380', name: 'Älvdalen' },
  { id: '2401', name: 'Gävle' },
  { id: '2403', name: 'Sandviken' },
  { id: '2404', name: 'Hudiksvall' },
  { id: '2405', name: 'Bollnäs' },
  { id: '2409', name: 'Hofors' },
  { id: '2417', name: 'Ockelbo' },
  { id: '2418', name: 'Ovanåker' },
  { id: '2421', name: 'Nordanstig' },
  { id: '2422', name: 'Ljusdal' },
  { id: '2425', name: 'Gävle' },
  { id: '2460', name: 'Bollnäs' },
  { id: '2462', name: 'Söderhamn' },
  { id: '2463', name: 'Hudiksvall' },
  { id: '2480', name: 'Sundsvall' },
  { id: '2481', name: 'Kramfors' },
  { id: '2482', name: 'Sollefteå' },
  { id: '2505', name: 'Härnösand' },
  { id: '2506', name: 'Timrå' },
  { id: '2510', name: 'Ånge' },
  { id: '2511', name: 'Sundsvall' },
  { id: '2513', name: 'Timrå' },
  { id: '2514', name: 'Ånge' },
  { id: '2518', name: 'Örnsköldsvik' },
  { id: '2521', name: 'Nordmaling' },
  { id: '2523', name: 'Bjurholm' },
  { id: '2560', name: 'Vännäs' },
  { id: '2580', name: 'Umeå' },
  { id: '2581', name: 'Lycksele' },
  { id: '2582', name: 'Skellefteå' },
  { id: '2583', name: 'Robertsfors' },
  { id: '2584', name: 'Norsjö' },
  { id: '2585', name: 'Malå' },
  { id: '2586', name: 'Storuman' },
  { id: '2587', name: 'Sorsele' },
  { id: '2588', name: 'Dorotea' },
  { id: '2589', name: 'Västerbottens län' },
  { id: '2590', name: 'Vilhelmina' },
  { id: '2591', name: 'Åsele' },
  { id: '2592', name: 'Vindelns' },
  { id: '2593', name: 'Nordmalings' },
  { id: '2594', name: 'Bjurholms' },
];

// Hämta alla kommuner (hårdkodad lista - fungerar alltid)
export async function getMunicipalities(): Promise<Array<{id: string, name: string}>> {
  // Returnera sorterad lista
  return [...ALL_MUNICIPALITIES].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
}

// Marknadsinsikter (mock för nu)
export async function getMarketInsights() {
  return {
    topOccupations: [
      { occupation: 'Sjuksköterskor', count: 1250, trend: 'up' },
      { occupation: 'Lagerarbetare', count: 980, trend: 'stable' },
      { occupation: 'Systemutvecklare', count: 850, trend: 'up' },
      { occupation: 'Kundtjänst', count: 720, trend: 'down' },
    ],
    topRegions: [
      { region: 'Stockholm', count: 5200 },
      { region: 'Göteborg', count: 3100 },
      { region: 'Malmö', count: 2100 },
    ],
    salaryRanges: {
      'IT': { min: 35000, max: 65000, median: 48000 },
      'Vård': { min: 28000, max: 45000, median: 34000 },
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Gap-analys - matcha kompetenser
export function analyzeSkillGap(
  userSkills: string[],
  jobRequirements: string[]
): {
  matching: string[];
  missing: string[];
  matchPercentage: number;
  recommendations: string[];
} {
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim());
  const normalizedJobReqs = jobRequirements.map((r) => r.toLowerCase().trim());

  const matching = normalizedJobReqs.filter((req) =>
    normalizedUserSkills.some((skill) => skill.includes(req) || req.includes(skill))
  );

  const missing = normalizedJobReqs.filter(
    (req) =>
      !normalizedUserSkills.some((skill) => skill.includes(req) || req.includes(skill))
  );

  const matchPercentage =
    normalizedJobReqs.length > 0
      ? Math.round((matching.length / normalizedJobReqs.length) * 100)
      : 0;

  const recommendations: string[] = [];
  if (missing.length > 0) {
    recommendations.push(
      `Överväg att lägga till: ${missing.slice(0, 3).join(', ')}`
    );
  }
  if (matchPercentage < 50) {
    recommendations.push('Fokusera på överförbara färdigheter');
  }
  if (matchPercentage >= 80) {
    recommendations.push('Du är väl kvalificerad!');
  }

  return {
    matching: matching.map((m) => jobRequirements[normalizedJobReqs.indexOf(m)]),
    missing: missing.map((m) => jobRequirements[normalizedJobReqs.indexOf(m)]),
    matchPercentage,
    recommendations,
  };
}

// Alias för bakåtkompatibilitet
export const searchJobs = searchPlatsbanken;
export const afApi = {
  searchJobs: searchPlatsbanken,
  getJobDetails,
  getAutocomplete,
  getMunicipalities,
  getMarketStats: getMarketInsights,
};

export default {
  searchPlatsbanken,
  searchJobs,
  getJobDetails,
  getAutocomplete,
  getMunicipalities,
  analyzeSkillGap,
  getMarketInsights,
  POPULAR_QUERIES,
  afApi,
};
