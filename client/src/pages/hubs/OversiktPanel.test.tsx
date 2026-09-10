/**
 * De fyra kategorierna ljuger inte. (Förslag A, 2026-08-18)
 *
 * Panelen är portalens startsida. Det är exakt den plats där felklassen från
 * granskningen 2026-08-09 gör mest skada: *ett påhittat värde har alltid
 * föredragits framför ett tomt fält*. Startsidan påstod 5 000 användare där det
 * fanns 92; konsulentvyn flaggade 100 % av deltagarna för alltid eftersom
 * fältet aldrig skrevs.
 *
 * Regeln (ROADMAP B31), i den form kategorierna kräver: en rad utan underlag
 * visar en INVIT — aldrig `0`, aldrig ett tankstreck, aldrig ett påhittat
 * exempel. Nollan är det värsta av de tre, för den ser ut som ett resultat.
 *
 * Två av testerna nedan finns för fel som faktiskt stod i drift:
 *   · "ANSÖKNINGAR 5" över "2 + 1 + 0 + 0" — talet och uppräkningen kom ur
 *     olika beräkningar (fixat 2026-08-18).
 *   · "Du har inte börjat söka jobb än" visades medan datan hämtades, till en
 *     användare med fem ansökningar.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OversiktPanel, { type PanelTillstand } from './OversiktPanel'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'

afterEach(cleanup)

function rendera(summary?: Partial<OversiktSummary>, tillstand: PanelTillstand = 'klart') {
  return render(
    <MemoryRouter>
      <OversiktPanel summary={summary as OversiktSummary | undefined} tillstand={tillstand} />
    </MemoryRouter>
  )
}

const TOMT_VARDAG = {
  recentMoodLogs: [],
  diaryEntryCount: 0,
  latestDiaryEntry: null,
  upcomingEvents: [],
  networkContactsCount: 0,
  consultant: null,
}

describe('de fyra kategorierna finns', () => {
  it('renderar alla fyra, i ordning, med en väg vidare till varje hubb', () => {
    rendera(undefined)
    // Nivå 3: sedan 2026-09-10 ligger de fyra under en h2 ("Allt i portalen"),
    // och nästa-steg-kortet och "Det som är igång" har egna h2.
    const rubriker = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(rubriker).toEqual(['Söka jobb', 'Karriär', 'Resurser', 'Din vardag'])

    const hubbar = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((h): h is string => !!h)
    for (const h of ['/jobb', '/karriar', '/resurser', '/min-vardag']) {
      expect(hubbar, `fot till ${h}`).toContain(h)
    }
    // Den synliga texten är kort ("Allt →") men namnet för hjälpmedel är helt.
    expect(screen.getByRole('link', { name: 'Allt i Söka jobb' })).toBeTruthy()
  })

  it('varje kategori bär sin egen hubbfärg via data-domain', () => {
    // DESIGN.md §4: färgen kommer ur --c-* som data-domain sätter, aldrig ur en
    // hårdkodad hub-token. Grinden lint:design fäller det senare.
    const { container } = rendera(undefined)
    const domaner = [...container.querySelectorAll('[data-domain]')].map((e) => e.getAttribute('data-domain'))
    expect(domaner).toEqual(['activity', 'coaching', 'info', 'wellbeing'])
  })
})

describe('ett nytt konto möts inte av nollor', () => {
  it('visar ingen nolla någonstans — varje tom rad har en invit i stället', () => {
    rendera({ jobsok: undefined, karriar: undefined, resurser: undefined, minVardag: undefined })
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.getByText(/hitta ditt första jobb/i)).toBeTruthy()
    expect(screen.getByText(/skapa ditt CV/i)).toBeTruthy()
    expect(screen.getByText(/skriv ditt första/i)).toBeTruthy()
    expect(screen.getByText(/öva när du orkar/i)).toBeTruthy()
  })

  it('använder ingen monospace någonstans — tidsstämplar och brickor i terminalstil är borta', () => {
    // Fram till 2026-09-10 stod "för länge sedan" och "5 aktiva" i 10,5 px
    // monospace. Målgruppen behöver större text, inte en terminal.
    const { container } = rendera({
      jobsok: {
        cv: { id: '1', updated_at: new Date(Date.now() - 200 * 86_400_000).toISOString() },
        coverLetters: [], interviewSessions: [],
        applicationStats: { total: 5, byStatus: {}, segments: [{ key: 'saved', count: 5 }], awaitingSince: null },
        spontaneousCount: 0,
      },
    })
    expect(container.querySelectorAll('.font-mono').length).toBe(0)
    expect(document.body.textContent).not.toMatch(/för länge sedan/i)
  })

  it('skuldbelägger inte i tomtillståndet', () => {
    // DESIGN.md §2: aldrig prestationsspråk mot deltagare. Inviterna ska vara
    // öppna dörrar, inte tillrättavisningar — inga "du har inte", inga "måste".
    rendera(undefined)
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/du måste|du borde|du har inte gjort/i)
  })
})

describe('talet och uppräkningen kan inte säga emot varandra', () => {
  it('underraden byggs ur samma segment som talet', () => {
    rendera({
      jobsok: {
        cv: null,
        coverLetters: [],
        interviewSessions: [],
        applicationStats: {
          total: 5,
          byStatus: {},
          segments: [
            { key: 'saved', count: 4 },
            { key: 'awaiting', count: 1 },
            { key: 'interview', count: 0 },
          ],
          awaitingSince: null,
        },
        spontaneousCount: 0,
      },
    })
    // Talet står två gånger: i "Det som är igång" (stort) och i hubbkortet.
    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    // Nollsegmentet nämns inte — en nolla i en uppräkning är brus.
    // Hubbkortets rad är den sista "Dina ansökningar" på sidan (kortet i
    // "Det som är igång" kommer först).
    const under = screen.getAllByText('Dina ansökningar').at(-1)!.parentElement!.querySelectorAll('span')[1]
    expect(under.textContent).toBe('4 sparade, 1 väntar på svar')
    expect(under.textContent).not.toMatch(/intervju/i)
  })

  it('uppräkningen summerar till talet', () => {
    rendera({
      jobsok: {
        cv: null, coverLetters: [], interviewSessions: [],
        applicationStats: {
          total: 3, byStatus: {},
          segments: [{ key: 'saved', count: 2 }, { key: 'closed', count: 1 }],
          awaitingSince: null,
        },
        spontaneousCount: 0,
      },
    })
    const mening =
      screen.getAllByText('Dina ansökningar').at(-1)!.parentElement!.querySelectorAll('span')[1].textContent ?? ''
    const summa = [...mening.matchAll(/(\d+)/g)].reduce((n, m) => n + Number(m[1]), 0)
    expect(summa).toBe(3)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
  })
})

describe('riktiga värden visas som de är', () => {
  const medData: Partial<OversiktSummary> = {
    jobsok: {
      cv: { id: '1', updated_at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
      coverLetters: [{ id: 'a', title: 'Brev till Rusta', created_at: new Date().toISOString() }],
      interviewSessions: [{ id: 's', score: 4, created_at: new Date().toISOString() }],
      applicationStats: { total: 5, byStatus: {}, segments: [{ key: 'saved', count: 5 }], awaitingSince: null },
      spontaneousCount: 0,
    },
    minVardag: { ...TOMT_VARDAG, consultant: { id: 'k', full_name: 'Sara Handledare', avatar_url: null } },
  }

  it('visar när CV:t senast ändrades — inte en påhittad färdighetsprocent', () => {
    // Skissen visade "CV klart 72 %". Den siffran FINNS INTE:
    // useJobsokHubSummary hämtar bara `id, updated_at` ur cvs.
    rendera(medData)
    expect(screen.getAllByText(/3 dagar sedan/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('ett CV från i våras sägs med månad, inte med "för länge sedan"', () => {
    const iVaras = new Date()
    iVaras.setMonth(iVaras.getMonth() - 4)
    rendera({
      jobsok: {
        cv: { id: '1', updated_at: iVaras.toISOString() },
        coverLetters: [], interviewSessions: [],
        applicationStats: { total: 0, byStatus: {}, segments: [], awaitingSince: null },
        spontaneousCount: 0,
      },
    })
    const manad = iVaras.toLocaleDateString('sv-SE', { month: 'long' })
    expect(screen.getAllByText(new RegExp(manad, 'i')).length).toBeGreaterThan(0)
    expect(screen.queryByText(/för länge sedan/i)).toBeNull()
  })

  it('konsulentens namn står på raden när det finns en konsulent', () => {
    rendera(medData)
    expect(screen.getAllByText('Sara Handledare').length).toBeGreaterThan(0)
  })

  it('säger "ingen kopplad än" i stället för att låtsas ha en konsulent', () => {
    rendera({ minVardag: TOMT_VARDAG })
    expect(screen.getByText(/ingen kopplad än/i)).toBeTruthy()
  })
})

describe('laddning och fel är inte tomhet', () => {
  it('påstår ingenting om användaren medan datan hämtas', () => {
    rendera(undefined, 'laddar')
    expect(screen.queryByText(/hitta ditt första jobb/i)).toBeNull()
    expect(screen.getAllByText(/hämtar/i).length).toBeGreaterThan(0)
  })

  it('markerar sig som upptagen för hjälpmedel under hämtning', () => {
    const { container } = rendera(undefined, 'laddar')
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(container.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull()
  })

  it('vid fel skyller den på portalen, inte på användaren', () => {
    rendera(undefined, 'fel')
    expect(screen.getByText(/inget du har gjort/i)).toBeTruthy()
    expect(screen.queryByText(/hitta ditt första jobb/i)).toBeNull()
  })
})

describe('fritext spränger inte layouten', () => {
  it('kortar drömjobbet — i prod innehåller fältet ibland en hel jobbannons', () => {
    // Sett i prod 2026-08-17: dream_job var 434 tecken med arbetsuppgifter och
    // kravprofil, och raden bredde ut sig utanför kortet.
    const lang =
      'Vi söker en lagermedarbetare till vårt distributionscenter i Göteborg. Arbetsuppgifter: plockning och packning av order, truckkörning, inventering.'
    rendera({
      karriar: {
        careerGoals: null,
        linkedinUrl: null,
        latestSkillsAnalysis: {
          dream_job: lang,
          skills_comparison: null,
          match_percentage: 40,
          created_at: new Date().toISOString(),
        },
        latestBrandAudit: null,
      },
    })
    // Drömjobbet står på underraden ("mot …") och i "Det som är igång" —
    // aldrig i rubriken, där annonstexten läckte in fram till 2026-09-10.
    const rader = screen.getAllByText(/lagermedarbetare/i)
    expect(rader.length).toBeGreaterThan(0)
    for (const rad of rader) {
      expect(rad.textContent!.length).toBeLessThan(lang.length)
      expect(rad.textContent).toContain('…')
    }
    expect(screen.queryByText(/Kompetenser mot/i)).toBeNull()
  })
})

describe('nivå 1 och 2 — nästa steg och det som är igång (2026-09-10)', () => {
  const dagar = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

  it('föreslår att följa upp en ansökan som väntat på svar i över en vecka, med ett alternativ', () => {
    rendera({
      jobsok: {
        cv: { id: '1', updated_at: dagar(2) },
        coverLetters: [],
        interviewSessions: [],
        applicationStats: {
          total: 3, byStatus: {},
          segments: [{ key: 'saved', count: 2 }, { key: 'awaiting', count: 1 }],
          awaitingSince: dagar(9).slice(0, 10),
        },
        spontaneousCount: 0,
      },
    })
    const kort = screen.getByTestId('nasta-steg')
    expect(kort.textContent).toMatch(/inte svarat på din ansökan/i)
    const knapp = screen.getByRole('link', { name: /följ upp ansökan$/i })
    expect(knapp.getAttribute('href')).toBe('/applications')
    // Alternativet: inga brev men ansökningar → "skriv ditt första personliga brev".
    expect(screen.getByRole('link', { name: /skriv ditt första personliga brev/i })).toBeTruthy()
  })

  it('ritar inget nästa steg och inget "igång" medan datan hämtas', () => {
    rendera(undefined, 'laddar')
    expect(screen.queryByTestId('nasta-steg')).toBeNull()
    expect(screen.queryByTestId('pagar')).toBeNull()
  })

  it('ritar inget "igång" för ett konto utan underlag — inviterna bor i hubbkorten', () => {
    rendera({ jobsok: undefined, karriar: undefined, resurser: undefined, minVardag: undefined })
    expect(screen.queryByTestId('pagar')).toBeNull()
  })

  it('"Det som är igång" visar bara sådant som finns, med talet stort', () => {
    rendera({
      resurser: {
        cv: null, coverLetters: [], recentArticles: [], articleCompletedCount: 0,
        aiTeamSessions: [{ agent_id: 'arbetskonsulent', updated_at: dagar(1) }],
        aiTeamSessionCount: 3,
      },
    })
    const sektion = screen.getByTestId('pagar')
    expect(sektion.textContent).toMatch(/Ditt AI-team/)
    expect(sektion.textContent).toMatch(/3\s*samtal/)
    // Bara AI-teamet har underlag → bara ett kort.
    expect(sektion.querySelectorAll('a').length).toBe(1)
  })

  it('ett nytt konto får "Börja med ditt CV" som första steg, inte en förebråelse', () => {
    rendera({
      jobsok: {
        cv: null, coverLetters: [], interviewSessions: [],
        applicationStats: { total: 0, byStatus: {}, segments: [], awaitingSince: null },
        spontaneousCount: 0,
      },
    })
    expect(screen.getByTestId('nasta-steg').textContent).toMatch(/Börja med ditt CV/)
    expect(document.body.textContent).not.toMatch(/du måste|du borde|du har inte gjort|för länge sedan/i)
  })
})

describe('negativ kontroll — testerna kan falla', () => {
  it('panelen renderar olika för tomt och fyllt', () => {
    rendera(undefined)
    const tomtAntalInviter = screen.getAllByText(/ditt första|inte påbörjat|inget sparat|ingen kopplad/i).length
    cleanup()
    rendera({
      jobsok: {
        cv: { id: '1', updated_at: new Date().toISOString() },
        coverLetters: [{ id: 'a', created_at: new Date().toISOString() }],
        interviewSessions: [{ id: 's', score: null, created_at: new Date().toISOString() }],
        applicationStats: { total: 7, byStatus: {}, segments: [{ key: 'saved', count: 7 }], awaitingSince: null },
        spontaneousCount: 0,
      },
    })
    expect(screen.getAllByText(/ditt första|inte påbörjat|inget sparat|ingen kopplad/i).length)
      .toBeLessThan(tomtAntalInviter)
    expect(screen.getAllByText('7').length).toBeGreaterThan(0)
  })
})
