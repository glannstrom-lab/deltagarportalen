/**
 * Hämtar Search Console-data för sc-domain:jobin.se.
 *
 * Två saker som annars ger fel svar:
 *  · ADC kräver headern `x-goog-user-project` — utan den svarar API:t 403
 *    med "accessNotConfigured", vilket ser ut som saknad behörighet men är
 *    ett kvotprojekt som inte skickats med.
 *  · Egendomen är en DOMÄNegendom, så den täcker både www och apex. Sidor
 *    ska ändå kanoniseras innan de summeras (lärdomen från coachonline.se).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const SITE = 'sc-domain:jobin.se'
const PROJEKT = 'claude-analytics-508619'
const UT = process.argv[2] || '.'

const token = execFileSync(
  'gcloud',
  ['auth', 'application-default', 'print-access-token'],
  { encoding: 'utf8', shell: true }
).trim()

async function fraga(body) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-goog-user-project': PROJEKT,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  const j = await r.json()
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(j).slice(0, 400)}`)
  return j.rows || []
}

const idag = new Date()
const dag = (n) => new Date(idag.getTime() - n * 864e5).toISOString().slice(0, 10)

// GSC har ~2-3 dygns fördröjning; startDate 16 mån tillbaka är maxhorisonten.
const BAS = { startDate: dag(480), endDate: dag(1), dataState: 'final' }

const jobb = {
  totalt: { ...BAS, dimensions: [] },
  perDatum: { ...BAS, dimensions: ['date'], rowLimit: 500 },
  fragor: { ...BAS, dimensions: ['query'], rowLimit: 1000 },
  sidor: { ...BAS, dimensions: ['page'], rowLimit: 1000 },
  land: { ...BAS, dimensions: ['country'], rowLimit: 50 },
  enhet: { ...BAS, dimensions: ['device'], rowLimit: 10 },
}

const resultat = {}
for (const [namn, body] of Object.entries(jobb)) {
  try {
    resultat[namn] = await fraga(body)
    console.log(`${namn.padEnd(10)} ${String(resultat[namn].length).padStart(5)} rader`)
  } catch (e) {
    console.error(`${namn.padEnd(10)} FEL — ${e.message}`)
    resultat[namn] = []
  }
}

fs.writeFileSync(`${UT}/jobin-gsc.json`, JSON.stringify(resultat, null, 1), 'utf8')
console.log(`\nSparat: ${UT}/jobin-gsc.json`)
console.log(`Period: ${BAS.startDate} → ${BAS.endDate}`)

const t = resultat.totalt[0]
if (t) {
  console.log(
    `\nTOTALT: ${t.impressions} exponeringar · ${t.clicks} klick · ` +
      `CTR ${(t.ctr * 100).toFixed(2)}% · snittposition ${t.position.toFixed(1)}`
  )
} else {
  console.log('\nTOTALT: inga rader alls — egendomen har ingen data i perioden.')
}
