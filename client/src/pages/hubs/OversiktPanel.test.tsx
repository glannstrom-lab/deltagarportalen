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
    const rubriker = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(rubriker).toEqual(['Söka jobb', 'Karriär', 'Resurser', 'Din vardag'])

    const hubbar = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((h): h is string => !!h)
    for (const h of ['/jobb', '/karriar', '/resurser', '/min-vardag']) {
      expect(hubbar, `fot till ${h}`).toContain(h)
    }
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

  it('visar ingen statusbricka när det inte finns något att säga', () => {
    const { container } = rendera(undefined)
    // Brickorna är de enda mono-elementen i kolumnhuvudena.
    expect(container.querySelectorAll('h2 ~ span.font-mono').length).toBe(0)
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
        },
        spontaneousCount: 0,
      },
    })
    expect(screen.getByText('5')).toBeTruthy()
    // Nollsegmentet nämns inte — en nolla i en uppräkning är brus.
    const under = screen.getByText('Dina ansökningar').parentElement!.querySelectorAll('span')[1]
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
        },
        spontaneousCount: 0,
      },
    })
    const mening =
      screen.getByText('Dina ansökningar').parentElement!.querySelectorAll('span')[1].textContent ?? ''
    const summa = [...mening.matchAll(/(\d+)/g)].reduce((n, m) => n + Number(m[1]), 0)
    expect(summa).toBe(3)
    expect(screen.getByText('3')).toBeTruthy()
  })
})

describe('riktiga värden visas som de är', () => {
  const medData: Partial<OversiktSummary> = {
    jobsok: {
      cv: { id: '1', updated_at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
      coverLetters: [{ id: 'a', title: 'Brev till Rusta', created_at: new Date().toISOString() }],
      interviewSessions: [{ id: 's', score: 4, created_at: new Date().toISOString() }],
      applicationStats: { total: 5, byStatus: {}, segments: [{ key: 'saved', count: 5 }] },
      spontaneousCount: 0,
    },
    minVardag: { ...TOMT_VARDAG, consultant: { id: 'k', full_name: 'Sara Handledare', avatar_url: null } },
  }

  it('visar när CV:t senast ändrades — inte en påhittad färdighetsprocent', () => {
    // Skissen visade "CV klart 72 %". Den siffran FINNS INTE:
    // useJobsokHubSummary hämtar bara `id, updated_at` ur cvs.
    rendera(medData)
    expect(screen.getByText(/3 dagar sedan/i)).toBeTruthy()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('konsulentens namn står i brickan när det finns en konsulent', () => {
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
    const rad = screen.getByText(/Kompetenser mot/i)
    expect(rad.textContent!.length).toBeLessThan(lang.length)
    expect(rad.textContent).toContain('…')
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
        applicationStats: { total: 7, byStatus: {}, segments: [{ key: 'saved', count: 7 }] },
        spontaneousCount: 0,
      },
    })
    expect(screen.getAllByText(/ditt första|inte påbörjat|inget sparat|ingen kopplad/i).length)
      .toBeLessThan(tomtAntalInviter)
    expect(screen.getByText('7')).toBeTruthy()
  })
})
