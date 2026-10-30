// AIX21 (2026-10-30): aktivitetsförslag ur kommunens egen katalog.
// Egen fil med understreck (som _rattstavning.js).
//
// Prompten får katalogens poster under korta id:n (a1, a2 …) och får bara svara med
// dem. Klienten slår tillbaka id:na till riktiga katalog-id. Skälet till alias:
// riktiga uuid:er innehåller sifferföljder som PII-saneringen kan ta för telefon-
// eller kontonummer, och ett förvanskat id vore svårt att felsöka. Validatorn
// förkastar varje id som inte finns i indata, så en påhittad aktivitet är
// omöjlig. Ingenting skapas utan klick: förslaget fyller i dialogen "Lägg till pass".

const MAX_POSTER = 60;
const MAX_FORSLAG = 4;
const MOTIVERING_MAX = 220;
const MAL_MAX = 800;

function kort(v, tak) {
  return typeof v === 'string' ? v.trim().slice(0, tak) : '';
}

/** Katalogen som prompten och validatorn båda läser: bara poster med ett id och en titel. */
function katalogRader(katalog) {
  return (Array.isArray(katalog) ? katalog : [])
    .filter((p) => p && typeof p === 'object' && typeof p.id === 'string' && p.id.trim() && typeof p.namn === 'string' && p.namn.trim())
    .slice(0, MAX_POSTER)
    .map((p) => ({
      id: p.id.trim().slice(0, 12),
      namn: kort(p.namn, 100),
      typ: kort(p.typ, 40),
      plats: kort(p.plats, 80),
      tid: kort(p.tid, 40),
    }));
}

function postText(p) {
  const delar = [p.typ && `typ: ${p.typ}`, p.plats && `plats: ${p.plats}`, p.tid && `tid: ${p.tid}`].filter(Boolean);
  return `${p.id}: ${p.namn}${delar.length ? ' (' + delar.join(', ') + ')' : ''}`;
}

function talI(text) {
  return (String(text ?? '').match(/\d+/g) || []).map((t) => t.replace(/^0+(?=\d)/, ''));
}

/**
 * @param {any} value  { forslag: [{ id, motivering }] } eller bara listan
 * @param {{ mal?: string, katalog?: any[] }} indata
 * @returns {{ ok: true, value: { forslag: Array<{ id: string, motivering: string }> } } | { ok: false, error: string }}
 */
function validera(value, indata) {
  const lista = Array.isArray(value) ? value : value && typeof value === 'object' ? value.forslag : undefined;
  if (!Array.isArray(lista)) return { ok: false, error: 'aktivitetsförslaget saknade lista' };
  const poster = katalogRader(indata?.katalog);
  const kanda = new Map(poster.map((p) => [p.id, p]));
  // Tal som får förekomma i en motivering: de som står i målet eller i katalogposten.
  const malTal = new Set(talI(kort(indata?.mal, MAL_MAX)));

  const forslag = [];
  const sedda = new Set();
  for (const rad of lista) {
    if (!rad || typeof rad !== 'object') continue;
    const id = typeof rad.id === 'string' ? rad.id.trim() : '';
    const post = kanda.get(id);
    if (!post || sedda.has(id)) continue; // okänt id: förkastas
    const motivering = kort(rad.motivering, MOTIVERING_MAX);
    if (!motivering) continue;
    const tillatna = new Set([...malTal, ...talI(postText(post))]);
    if (talI(motivering).some((t) => !tillatna.has(t))) continue;
    sedda.add(id);
    forslag.push({ id, motivering });
    if (forslag.length >= MAX_FORSLAG) break;
  }
  // Modellen föreslog något men inget av det höll: det är ett fel, inte "inget passar".
  if (lista.length > 0 && forslag.length === 0) {
    return { ok: false, error: 'inget av förslagen fanns i katalogen eller höll sig till underlaget' };
  }
  return { ok: true, value: { forslag } };
}

module.exports = { validera, katalogRader, postText, MAX_POSTER, MAX_FORSLAG, MAL_MAX };
