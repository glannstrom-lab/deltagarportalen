/**
 * Instrumentpanelen ljuger inte. (Steg 3, 2026-08-17)
 *
 * Panelen visar fem tal i hjälteposition på portalens startsida. Det är exakt
 * den plats där felklassen från granskningen 2026-08-09 gör mest skada: *ett
 * påhittat värde har alltid föredragits framför ett tomt fält*. Startsidan
 * påstod 5 000 användare där det fanns 92; konsulentvyn flaggade 100 % av
 * deltagarna för alltid eftersom fältet aldrig skrevs.
 *
 * Regeln (ROADMAP B31): ett värde utan underlag visar `—` och en rad om
 * varför. Aldrig 0, aldrig 100 %, aldrig ett påhittat exempel.
 *
 * De här testerna finns för att göra just den regeln körbar. Ett nytt konto —
 * vilket de allra flesta av portalens 92 konton i praktiken är — ska aldrig
 * mötas av nollor som ser ut som resultat.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OversiktPanel from './OversiktPanel'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'

afterEach(cleanup)

function rendera(summary?: Partial<OversiktSummary>) {
  return render(
    <MemoryRouter>
      <OversiktPanel summary={summary as OversiktSummary | undefined} />
    </MemoryRouter>
  )
}

describe('nytt konto möts inte av nollor', () => {
  it('visar tankstreck, inte 0, när ingenting finns', () => {
    rendera(undefined)
    const streck = screen.getAllByText('—')
    expect(streck.length).toBe(5)
    // Det avgörande: ingen ruta visar en nolla som ser ut som ett resultat.
    expect(screen.queryByText('0')).toBeNull()
  })

  it('varje tomt tal förklarar sig i stället för att bara vara tomt', () => {
    rendera(undefined)
    expect(screen.getByText(/inte börjat söka jobb/i)).toBeTruthy()
    expect(screen.getByText(/Inte påbörjat än/i)).toBeTruthy()
    expect(screen.getByText(/Inget skrivet än/i)).toBeTruthy()
    expect(screen.getByText(/Inte provat än/i)).toBeTruthy()
    // 'Inget inbokat' finns både i nyckeltalet och i Framöver-kortet.
    expect(screen.getAllByText(/Inget inbokat/i).length).toBeGreaterThan(0)
  })

  it('tomma "Fortsätt där du var" skuldbelägger inte', () => {
    // DESIGN.md §2: aldrig prestationsspråk mot deltagare. Ett tomt tillstånd
    // ska vara en öppen dörr, inte en tillrättavisning.
    rendera(undefined)
    expect(screen.getByText(/helt okej/i)).toBeTruthy()
  })
})

describe('riktiga tal visas som de är', () => {
  const medData: Partial<OversiktSummary> = {
    jobsok: {
      cv: { id: '1', updated_at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
      coverLetters: [{ id: 'a', title: 'Brev till Rusta', created_at: new Date().toISOString() }],
      interviewSessions: [{ id: 's', score: 4, created_at: new Date().toISOString() }],
      applicationStats: { total: 5, byStatus: {}, segments: [{ label: 'aktiva', count: 2 }] },
      spontaneousCount: 0,
    },
  }

  it('visar antalet ansökningar', () => {
    rendera(medData)
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('visar när CV:t senast ändrades — inte en påhittad färdighetsprocent', () => {
    // Skissen visade "CV klart 72 %". Den siffran FINNS INTE:
    // useJobsokHubSummary hämtar bara `id, updated_at` ur cvs. Att räkna fram
    // en procent hade varit att uppfinna den.
    rendera(medData)
    // Står både i CV-nyckeltalet och i Fortsätt-listan.
    expect(screen.getAllByText(/3 dagar sedan/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('listar bara saker som faktiskt finns i "Fortsätt där du var"', () => {
    rendera(medData)
    expect(screen.getByText('Brev till Rusta')).toBeTruthy()
    expect(screen.getAllByText('Ditt CV').length).toBeGreaterThan(0)
    // Ingen dagbok i datat ⇒ ingen dagboksrad.
    expect(screen.queryByText('Din dagbok')).toBeNull()
  })
})

describe('måendekurvan ritas inte av en enda punkt', () => {
  const medMood = (antal: number): Partial<OversiktSummary> => ({
    minVardag: {
      recentMoodLogs: Array.from({ length: antal }, (_, i) => ({
        mood_level: 3,
        energy_level: 3,
        log_date: new Date(Date.now() - i * 86_400_000).toISOString(),
      })),
      diaryEntryCount: 0,
      latestDiaryEntry: null,
      upcomingEvents: [],
      networkContactsCount: 0,
      consultant: null,
    },
  })

  it('döljs vid färre än tre loggningar — en stapel är ingen kurva', () => {
    rendera(medMood(1))
    expect(screen.queryByText(/Hur du mått/i)).toBeNull()
  })

  it('visas vid tre eller fler', () => {
    rendera(medMood(3))
    expect(screen.getByText(/Hur du mått/i)).toBeTruthy()
  })
})

describe('fritext spränger inte layouten', () => {
  it('kortar drömjobbet — i prod innehåller fältet ibland en hel jobbannons', () => {
    // Sett i prod 2026-08-17: dream_job var 300+ tecken med arbetsuppgifter
    // och kravprofil, och raden bredde ut sig utanför kortet.
    const lang = 'Vi söker en lagermedarbetare till vårt distributionscenter i Göteborg. Arbetsuppgifter: plockning och packning av order, truckkörning, inventering.'
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

describe('negativ kontroll — testet kan falla', () => {
  it('panelen renderar olika för tomt och fyllt', () => {
    rendera(undefined)
    const tomtAntal = screen.getAllByText('—').length
    cleanup()
    rendera({
      jobsok: {
        cv: null,
        coverLetters: [],
        interviewSessions: [],
        applicationStats: { total: 7, byStatus: {}, segments: [] },
        spontaneousCount: 0,
      },
    })
    expect(screen.getAllByText('—').length).toBeLessThan(tomtAntal)
    expect(screen.getByText('7')).toBeTruthy()
  })
})
