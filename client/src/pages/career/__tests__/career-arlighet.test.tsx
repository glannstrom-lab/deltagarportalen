/**
 * Vakter för Karriär-sidan efter genomgången 2026-08-21.
 *
 * Varför källkodsvakter och inte bara renderingstester: flera av felen som
 * rättades går inte att se i en rendering med tomma mockar — de sitter i
 * ETIKETTER som beskriver fel sak, i en `0.7`-schablon, och i frånvaron av ett
 * tredje tillstånd. Ett renderingstest mot en mockad klient hade gått grönt
 * genom hela historien (jfr `journey_goals`-fällan och
 * `useJobsokHubSummary.test.ts`, som asserterade den trasiga formen).
 *
 * Lärdomen 2026-08-09 gäller: fråga inte "finns det ett test?" utan "vad
 * händer om jag går sönder koden?". Varje test nedan har prövats genom att
 * återinföra det fel det vaktar mot.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const HAR = join(__dirname, '..')
const las = (fil: string) => readFileSync(join(HAR, fil), 'utf-8')

/**
 * Källkoden UTAN kommentarer.
 *
 * Nödvändigt, och inte en petitess: varje rättelse här är dokumenterad i en
 * docstring som beskriver felet den tog bort — alltså står de förbjudna
 * strängarna kvar i filen, i kommentaren. Första körningen av den här sviten
 * fällde tio av tolv negativa vakter på exakt det: de matchade sina egna
 * förklaringar. En vakt som läser kommentarer mäter inte koden.
 *
 * `(?<!:)//` så att `https://` inte tas för en radkommentar.
 */
const kod = (fil: string) =>
  las(fil)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(?<!:)\/\/.*$/gm, '')

describe('Arbetsmarknad — etiketterna beskriver det datan faktiskt är', () => {
  const kalla = kod('LaborMarketTab.tsx')

  it('kallar inte annonsantal per yrkesgrupp för "mest sökta"', () => {
    // `stats=occupation-group` är antal publicerade annonser. Ingen har sökt.
    expect(kalla).not.toMatch(/Mest sökta|Most Searched/i)
  })

  it('stympar inte regionnamnen', () => {
    // `.replace(' län', '')` gjorde "Stockholms län" till "Stockholms".
    expect(kalla).not.toContain(".replace(' län'")
  })

  it('låter en tom dellista inte spränga hela fliken', () => {
    // Promise.all + wrappers som kastar på tomt resultat raderade totalsiffran
    // och regionerna när kompetenslistan var tom.
    expect(kalla).toContain('Promise.allSettled')
    expect(kalla).not.toMatch(/getTrendingSkillsWithFallback|getMarketStatsWithFallback/)
  })

  it('visar datans ålder, inte renderingstiden', () => {
    expect(kalla).toContain('marketStats?.last_updated')
    expect(kalla).not.toMatch(/setLastUpdated\(new Date\(\)/)
  })
})

describe('Branschradarn är borta och ritar inte samma data en gång till', () => {
  it('monteras inte i Arbetsmarknad', () => {
    /*
      Radarn hämtade samma af-trends-data och ritade samma fem yrkesgrupper,
      samma fem kompetenser, samma totalsiffra och samma regioner som fliken
      själv. Att dubbleringen inte syntes berodde på att en AiConsentGate dolde
      sektionen för konton utan AI-samtycke — trots noll AI-anrop.
    */
    expect(kod('LaborMarketTab.tsx')).not.toMatch(/<IndustryRadarSection/)
  })

  it('lämnar inga döda i18n-nycklar efter sig', () => {
    for (const lang of ['sv', 'en']) {
      const d = JSON.parse(readFileSync(join(HAR, `../../i18n/locales/${lang}.json`), 'utf-8'))
      expect(d.career.industryRadar).toBeUndefined()
    }
  })
})

describe('Flytta — inga schabloner, inga tal utan stämpel', () => {
  const kalla = kod('RelocationTab.tsx')

  it('räknar nettolön med lib/skatt.ts, inte 0,7', () => {
    expect(kalla).toContain('beraknaNetto')
    expect(kalla).not.toMatch(/\*\s*0\.7\b/)
  })

  it('kan inte rendera Infinity eller NaN som hyresandel', () => {
    // Vakten sitter i beraknaNetto (null för orimlig indata) plus nollkollen.
    expect(kalla).toContain('nettoUppgift.nettoManad <= 0')
  })

  it('rensar ett tömt fält med null, inte undefined', () => {
    // undefined faller bort ur JSON och lämnade gamla värdet kvar i databasen.
    expect(kalla).toContain('current_region: currentRegion || null')
    expect(kalla).toMatch(/expected_salary:.*null/)
  })

  it('blockerar autospar efter ett läsfel', () => {
    expect(kalla).toContain('if (loadError) return')
  })

  it('gör målstäderna valbara med tangentbord i BÅDA renderingarna', () => {
    // Klicket låg på <tr> utan roll, tabindex eller namn.
    expect(kalla).not.toMatch(/<tr[^>]*onClick/)
    /*
      Två renderingar: tabellen (≥ sm) och kortlistan (mobil). Ett enkelt
      `toContain` räckte inte — mutationsprovet visade att man kan ta bort
      aria-pressed ur den ena och ändå passera, vilket är just den halva
      tillgänglighet som fällde UX16 (fixen verifierades där den lagades,
      inte där den flyttade).
    */
    expect((kalla.match(/aria-pressed=\{isTarget\}/g) || []).length).toBe(2)
  })

  it('bär inte längre en påhittad jobbmarknadsetikett', () => {
    expect(kalla).not.toMatch(/Mycket stark|jobMarket/)
  })

  it('anger inga belopp eller villkor för Arbetsförmedlingens stöd', () => {
    const sv = JSON.parse(readFileSync(join(HAR, '../../i18n/locales/sv.json'), 'utf-8'))
    expect(sv.career.relocation.supportBody).toMatch(/inga belopp eller villkor/)
  })
})

describe('Flyttdatan är märkt med vad den är', () => {
  it('har ett kontrolldatum och ingen lönekolumn', () => {
    const data = kod('../../data/flyttdata.ts')
    expect(data).toMatch(/UPPGIFTERNA_ANGAVS = '\d{4}-\d{2}-\d{2}'/)
    // Lönefrågan ägs av /salary via lonedata.ts. Två svar på samma fråga var
    // precis det lonedata.ts skrevs för att avskaffa.
    expect(data).not.toMatch(/avgSalary|snittlon/i)
  })
})

describe('Karriärplan — tyst dataförlust och falsk AI-märkning', () => {
  const kalla = kod('PlanTab.tsx')

  it('visar inte skapa-formuläret när vi inte vet om en plan finns', () => {
    // plan === null (ingen plan) måste hållas isär från loadError (vet inte).
    // Annars fyller användaren i på nytt och create() avaktiverar den gamla.
    expect(kalla).toContain('setLoadError(true)')
    expect(kalla).toMatch(/if \(loadError\) \{[\s\S]*?role="alert"/)
  })

  it('skriver inte till databasen per pixel när reglaget dras', () => {
    expect(kalla).toContain('onPointerUp')
    expect(kalla).not.toMatch(/onChange=\{\(e\) => updateMilestoneProgress/)
  })

  it('tar bort AI-märkningen när användaren lägger till en egen milstolpe', () => {
    // Watermarken ligger under HELA listan; annars märks användarens egna ord
    // som AI-utdata (AI Act art. 50.2, spegelvänt mot mockGenerateLetter).
    expect(kalla).toMatch(/setIsAddingMilestone\(false\)[\s\S]{0,900}setAiGenerated\(false\)/)
  })

  it('renderar inte en rå tidsramsslug', () => {
    // FocusCareerWizard skriver '5_years' — det stod bokstavligen i UI:t.
    expect(kalla).toContain('career.plan.timeframes.')
  })

  it('härleder framsteg ur milstolparna, inte ur den DELETE-blinda triggern', () => {
    expect(kalla).not.toMatch(/plan\?\.total_progress \|\|/)
  })

  it('ger raderaknappen ett tillgängligt namn', () => {
    expect(kalla).toMatch(/aria-label=\{t\('career\.plan\.deletePlanLabel'\)\}/)
  })
})

describe('Anpassning — art. 9-data får inte skrivas över av ett läsfel', () => {
  const kalla = kod('AdaptationTab.tsx')

  it('blockerar autospar tills en läsning lyckats', () => {
    expect(kalla).toContain('if (loadError) return')
  })

  it('nollställer inte state förrän raderingen lyckats', () => {
    // Tidigare nollställdes state FÖRE anropet: användaren såg en tom lista
    // medan uppgifterna låg kvar i databasen. Art. 17.
    expect(kalla).toMatch(/await adaptationsApi\.delete\(\)[\s\S]{0,200}setSelectedNeeds\(\{\}\)/)
    expect(kalla).toContain('setSelectedNeeds(tidigareVal)')
  })

  it('tappar inte ett köat spar', () => {
    expect(kalla).toContain('pendingSave.current = true')
  })

  it('ger rensa-allt-knappen ett tillgängligt namn', () => {
    expect(kalla).toMatch(/aria-label=\{isEn \? 'Clear all your choices'/)
  })
})

describe('Anpassning — myndighetspåståenden', () => {
  const kalla = kod('AdaptationTab.tsx')

  it('namnger ingen nedlagd myndighet', () => {
    // Hjälpmedelsinstitutet avvecklades 2014.
    expect(kalla).not.toContain('Hjälpmedelsinstitutet')
  })

  it('har inga länkar som gav 404 vid kontrollen', () => {
    for (const dod of [
      'av.se/arbetsmiljoarbete-och-inspektioner/arbetsanpassning',
      'stod-och-insatser/stod-a-o/stod-vid-funktionsnedsattning',
      'for-arbetsgivare/stod-och-insatser/anpassningsstod',
      'privatperson/funktionsnedsattning/arbetshjalpmedel',
    ]) {
      expect(kalla).not.toContain(dod)
    }
  })

  it('bär ett kontrolldatum för länkarna', () => {
    expect(kalla).toMatch(/LANKARNA_KONTROLLERADES = '\d{4}-\d{2}-\d{2}'/)
  })

  it('listar ingen påhittad kravlista för Försäkringskassan', () => {
    expect(kalla).not.toContain('Intyg från läkare eller specialist\\n2.')
  })

  it('behåller ordet "skäliga" och anger lagrum i rättighetspåståendet', () => {
    expect(kalla).toContain('skäliga åtgärder')
    expect(kalla).toContain('2008:567')
    expect(kalla).toContain('1977:1160')
  })
})

describe('Meriter — förslagen är skrivna för portalens målgrupp', () => {
  const kalla = kod('CredentialsTab.tsx')

  it('leder inte med IT- och projektledningscertifikat', () => {
    for (const fel of ['AWS Certified', 'PRINCE2', 'Scrum Master', 'HubSpot', 'Project Management Professional']) {
      expect(kalla).not.toContain(fel)
    }
  })

  it('döljer inte slutet av förslagslistan', () => {
    // `.slice(0, 6)` gjorde SFI onåbart — det låg på index 8.
    expect(kalla).not.toContain('.slice(0, 6)')
  })

  it('har ett tredje läge och toastar sina mutationer', () => {
    expect(kalla).toContain('setLoadError(true)')
    expect(kalla).toContain("showToast.error(t('career.credentials.saveFailed'))")
  })

  it('har ett tomtillstånd', () => {
    expect(kalla).toContain('<EmptyState')
  })
})

describe('Skalet', () => {
  it('avmonterar inte flikarna när fokusläget slås på', () => {
    // Samma bugg som intervjusimulatorn hade till 2026-08-19: hela trädet
    // byttes ut och allt ifyllt försvann.
    const kalla = kod('../Career.tsx')
    expect(kalla).not.toMatch(/if \(isFocusMode\) \{\s*return/)
    expect(kalla).toContain("isFocusMode ? { display: 'none' } : undefined")
  })

  it('har ingen permanent "Ny!"-badge på flikarna', () => {
    const tabs = kod('../../data/careerTabs.ts')
    expect(tabs).not.toContain('badgeKey')
  })

  it('har bara en flikdefinition', () => {
    const tabs = kod('../../data/careerTabs.ts')
    expect(tabs).not.toMatch(/export const careerTabs\b/)
  })
})
