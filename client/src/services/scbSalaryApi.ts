/**
 * Löneuppslag för intresseguidens yrkespanel.
 *
 * VAD DET HÄR ÄR: tjugo handskrivna rader i SALARY_DATA_2026, mest IT- och
 * kontorsyrken. Någon SCB-anslutning har aldrig funnits — filhuvudet sa
 * tidigare "Provides salary statistics from Statistics Sweden (SCB)" och
 * "Uses their public API when available", och båda var osanna.
 *
 * data/lonedata.ts namnger den här filen som den tredje osynkade kopian av
 * portalens löneuppgifter. Rätta vägen framåt är att läsa därifrån eller från
 * afTrendsApi.getSalaryStats — inte att lägga till en fjärde.
 */

// supabase-importen borttagen 2026-07-27 (H5): den enda databasanvändningen
// var logSalaryLookup, som skrev till en tabell som inte finns.

export interface SalaryData {
  occupation: string
  occupationCode: string
  median: number
  p10: number // 10th percentile
  p90: number // 90th percentile
  mean: number
  sampleSize?: number
  year: number
  sector?: 'private' | 'public' | 'all'
}

// Latest curated salary data (updated 2026-Q1)
const SALARY_DATA_2026: SalaryData[] = [
  { occupation: 'Systemutvecklare', occupationCode: '2512', median: 52000, p10: 38000, p90: 72000, mean: 54000, year: 2026, sector: 'all' },
  { occupation: 'Mjukvaruutvecklare', occupationCode: '2514', median: 50000, p10: 36000, p90: 68000, mean: 52000, year: 2026, sector: 'all' },
  { occupation: 'Dataingenjör', occupationCode: '2149', median: 48000, p10: 35000, p90: 65000, mean: 49000, year: 2026, sector: 'all' },
  { occupation: 'Ekonom', occupationCode: '2411', median: 45000, p10: 32000, p90: 62000, mean: 46000, year: 2026, sector: 'all' },
  { occupation: 'Säljare', occupationCode: '3322', median: 42000, p10: 28000, p90: 65000, mean: 45000, year: 2026, sector: 'private' },
  { occupation: 'Jurist', occupationCode: '2611', median: 55000, p10: 38000, p90: 85000, mean: 58000, year: 2026, sector: 'all' },
  { occupation: 'Sjuksköterska', occupationCode: '2221', median: 40000, p10: 33000, p90: 48000, mean: 40500, year: 2026, sector: 'public' },
  { occupation: 'Gymnasielärare', occupationCode: '2320', median: 38500, p10: 32000, p90: 45000, mean: 38800, year: 2026, sector: 'public' },
  { occupation: 'Projektledare', occupationCode: '1211', median: 52000, p10: 38000, p90: 72000, mean: 54000, year: 2026, sector: 'all' },
  { occupation: 'HR-specialist', occupationCode: '1213', median: 43000, p10: 33000, p90: 55000, mean: 44000, year: 2026, sector: 'all' },
  { occupation: 'Marknadsförare', occupationCode: '2431', median: 42000, p10: 32000, p90: 58000, mean: 44000, year: 2026, sector: 'private' },
  { occupation: 'UX-designer', occupationCode: '2166', median: 48000, p10: 35000, p90: 62000, mean: 49000, year: 2026, sector: 'private' },
  { occupation: 'Produktägare', occupationCode: '2512', median: 55000, p10: 42000, p90: 72000, mean: 56000, year: 2026, sector: 'private' },
  { occupation: 'DevOps-ingenjör', occupationCode: '2512', median: 55000, p10: 42000, p90: 75000, mean: 57000, year: 2026, sector: 'private' },
  { occupation: 'AI/ML-ingenjör', occupationCode: '2512', median: 58000, p10: 45000, p90: 85000, mean: 62000, year: 2026, sector: 'private' },
  { occupation: 'Dataanalytiker', occupationCode: '2120', median: 45000, p10: 35000, p90: 60000, mean: 47000, year: 2026, sector: 'all' },
  { occupation: 'Arkitekt', occupationCode: '2161', median: 48000, p10: 38000, p90: 62000, mean: 49000, year: 2026, sector: 'all' },
  { occupation: 'Undersköterska', occupationCode: '5321', median: 30500, p10: 27000, p90: 35000, mean: 30800, year: 2026, sector: 'public' },
  { occupation: 'Civilingenjör', occupationCode: '2141', median: 50000, p10: 38000, p90: 68000, mean: 52000, year: 2026, sector: 'all' },
  { occupation: 'Controller', occupationCode: '2411', median: 52000, p10: 40000, p90: 68000, mean: 54000, year: 2026, sector: 'private' },
]

class SCBSalaryService {
  /**
   * Get salary data for a specific occupation
   */
  async getSalaryByOccupation(
    occupation: string,
    options?: { sector?: 'private' | 'public' | 'all' }
  ): Promise<SalaryData | null> {
    const sector = options?.sector || 'all'
    const searchTerm = occupation.toLowerCase()

    // Search in curated data
    const match = SALARY_DATA_2026.find(
      s => s.occupation.toLowerCase().includes(searchTerm) ||
           searchTerm.includes(s.occupation.toLowerCase())
    )

    if (match) {
      // Apply sector adjustment
      if (sector !== 'all' && match.sector !== sector) {
        const adjustment = sector === 'public' ? 0.92 : 1.08
        return {
          ...match,
          median: Math.round(match.median * adjustment),
          mean: Math.round(match.mean * adjustment),
          p10: Math.round(match.p10 * adjustment),
          p90: Math.round(match.p90 * adjustment),
          sector,
        }
      }
      return match
    }

    /*
      RETURNERAR NULL. Här stod "return this.estimateSalary(occupation)", som
      gav MEDELVÄRDET av de tjugo handskrivna raderna — samma tal för varje
      okänt yrke. Intresseguiden har 142 yrken, så 128 av dem fick
      "Median 47 450 kr" med percentiler, under rubriken "Löneinformation"
      och med filhuvudets påstående om SCB bakom sig. Frisör, kock och städare
      fick alltså alla samma "lönestatistik".

      Mönstret finns redan i huset: afTrendsApi.getSalaryStats returnerar null
      utan underlag. (Granskning 2026-08-21.)
    */
    return null
  }

  // estimateSalary RADERAD 2026-08-21. Den returnerade medelvärdet av de
  // tjugo handskrivna raderna som "median" för varje okänt yrke, med
  // occupationCode: 'UNKNOWN' och p10/p90 satta till ×0,7 och ×1,4. Se
  // kommentaren i getSalaryByOccupation. Lägg inte tillbaka den: ett tal utan
  // underlag ska visas som "—", inte som statistik.

  // logSalaryLookup RADERAD 2026-07-27 (H5). Skrev till tabellen
  // `salary_lookups` som inte finns — insert:en failade tyst i sitt catch vid
  // varje lönesökning. Den fanns för analytics, inte för deltagarnytta, och
  // ingen analysvy har någonsin läst den. Att skapa tabellen hade betytt att
  // börja logga vilka yrken varje deltagare tittar på, alltså mer persondata
  // för ingen nytta — fel väg strax före Art 30-genomgången (H7).
  // Anropare fanns redan inte. Finns i git-historiken.
}

export const scbSalaryService = new SCBSalaryService()
export default scbSalaryService
