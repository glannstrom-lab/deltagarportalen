/**
 * ApplicationsCalendar — månadsvy över det som är inplanerat
 *
 * Fliken hette "Kalender" och var två listor: "Idag" och "Kommande 30 dagar".
 * Ingen månadsvy, ingen navigering, inga dagceller — och intervjudatumen på
 * ansökningarna (`saved_jobs.interview_date`) visades ingenstans i portalen
 * trots att kolumnen finns i prod och är mappad åt båda håll.
 *
 * Valet 2026-08-19 var att göra fliken till det den heter, i stället för att
 * döpa om den till "Påminnelser". Skälen står i rapporten; det korta är att
 * en kalender är rätt form för "vad händer när", och att intervjuerna behövde
 * en yta som listorna inte gav dem.
 *
 * `CalendarWidget` i `@/components/ui` återanvänds INTE. Den ritar bara
 * innevarande månad, tar `activeDays: number[]` (inga händelser, inga datum
 * utanför månaden), har ingen månadsnavigering, ingen tangentbordshantering,
 * inga klickmål, hårdkodade svenska månadsnamn och `bg-primary`. Att bygga
 * vidare på den hade betytt att skriva om den — och den har noll anropare i
 * hela portalen, så en omskrivning där hade bara varit den här omskrivningen,
 * fast i en fil som andra sidor importerar via barreln.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Bell, CheckCircle, Clock, ChevronLeft, ChevronRight,
  Phone, Users, FileCheck, AlertCircle, AlertTriangle, Briefcase
} from '@/components/ui/icons'
import { Card, EmptyState, ErrorState, SkeletonList } from '@/components/ui'
import { showToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import { useApplicationLookup, useApplicationReminders } from '@/hooks/useApplications'
import type { Application, ReminderType } from '@/types/application.types'

// ============================================
// DATUM — allt räknas i användarens LOKALA dygn
// ============================================

/**
 * 'YYYY-MM-DD' för ett Date, i lokal tid.
 *
 * `toISOString().split('T')[0]` gör samma sak i UTC och ger fel dygn för varje
 * kväll i Sverige. Den här funktionen gör det inte.
 */
function dagnyckel(datum: Date): string {
  const ar = datum.getFullYear()
  const manad = String(datum.getMonth() + 1).padStart(2, '0')
  const dag = String(datum.getDate()).padStart(2, '0')
  return `${ar}-${manad}-${dag}`
}

/**
 * Ett datumvärde ur databasen som lokal dygnsnyckel.
 *
 * De två källorna har olika typ och får inte behandlas lika:
 * - `application_reminders.reminder_date` är DATE → '2026-08-19'. Ett rent
 *   datum har ingen tidzon. `new Date('2026-08-19')` tolkar det som
 *   UTC-midnatt (02:00 svensk sommartid), och en jämförelse mot lokal midnatt
 *   00:00 blir därför sann åt fel håll — vilket är precis varför dagens
 *   påminnelser låg i BÅDE "Idag" och "Kommande", året om. Strängen används
 *   som den är.
 * - `saved_jobs.interview_date` är TIMESTAMPTZ → en verklig tidpunkt, som ska
 *   räknas om till det lokala dygn den infaller i.
 */
function dagnyckelAv(varde: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(varde)) return varde
  const datum = new Date(varde)
  if (Number.isNaN(datum.getTime())) return varde.slice(0, 10)
  return dagnyckel(datum)
}

/** Lokalt Date (mitt på dygnet) ur en dygnsnyckel — aldrig via `new Date(sträng)`. */
function franDagnyckel(nyckel: string): Date {
  const [ar, manad, dag] = nyckel.split('-').map(Number)
  return new Date(ar, (manad || 1) - 1, dag || 1, 12, 0, 0)
}

/** 'HH:mm' i lokal tid, eller null när tidpunkten är dygnets början. */
function lokalTid(varde: string): string | null {
  const datum = new Date(varde)
  if (Number.isNaN(datum.getTime())) return null
  if (datum.getHours() === 0 && datum.getMinutes() === 0) return null
  return `${String(datum.getHours()).padStart(2, '0')}:${String(datum.getMinutes()).padStart(2, '0')}`
}

/**
 * Versal på första tecknet — inte CSS-klassen `capitalize`.
 *
 * `capitalize` versaliserar varje ord och gav "Söndag 9 Augusti 2026".
 * Svenskan skriver varken veckodag eller månad med versal inuti en fras.
 */
function stortForsta(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ============================================
// PÅMINNELSETYPER
// ============================================

// En sida = en hub-färg (DESIGN.md §4). Typerna skiljs åt av ikonen, inte av
// fem olika pasteller — tidigare bar samma vy amber, sky, rött, sten och
// aktivitetsfärgen samtidigt.
const REMINDER_TYPE_CONFIG: Record<ReminderType, { icon: React.ElementType; label: string }> = {
  follow_up: { icon: Bell, label: 'Uppföljning' },
  interview: { icon: Users, label: 'Intervju' },
  phone_screen: { icon: Phone, label: 'Telefonintervju' },
  assessment: { icon: FileCheck, label: 'Arbetsprov' },
  deadline: { icon: AlertCircle, label: 'Sista dag' },
  custom: { icon: Bell, label: 'Påminnelse' }
}

// Uppslaget var ogardat. `reminder_type` är CHECK-begränsad i dag, men en ny
// typ i databasen hade kraschat hela fliken på `config.icon`.
const OKAND_TYP = { icon: Bell, label: 'Påminnelse' }

function typkonfig(typ: ReminderType) {
  return REMINDER_TYPE_CONFIG[typ] ?? OKAND_TYP
}

// ============================================
// HÄNDELSER — påminnelser och intervjuer i samma tidslinje
// ============================================

interface Handelse {
  id: string
  /** Lokal dygnsnyckel, 'YYYY-MM-DD' */
  dag: string
  /** 'HH:mm' eller null */
  tid: string | null
  titel: string
  typtext: string
  ikon: React.ElementType
  /** "Tjänst · Företag" — vilken ansökan händelsen gäller */
  ansokan: string | null
  beskrivning: string | null
  /** Satt bara för påminnelser: ett intervjudatum går inte att bocka av här */
  paminnelseId: string | null
}

function ansokansetikett(ansokan: Application | undefined): string | null {
  if (!ansokan) return null
  const jobData = ansokan.jobData as { employer?: { name?: string }; headline?: string } | undefined
  const titel = ansokan.jobTitle || jobData?.headline
  const foretag = ansokan.companyName || jobData?.employer?.name
  const etikett = [titel, foretag].filter(Boolean).join(' · ')
  return etikett || null
}

// ============================================
// KORT FÖR EN HÄNDELSE
// ============================================

function HandelseKort({
  handelse,
  forsenad = false,
  visaDatum = false,
  onKlar
}: {
  handelse: Handelse
  forsenad?: boolean
  visaDatum?: boolean
  onKlar: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const Ikon = handelse.ikon
  const paminnelseId = handelse.paminnelseId

  return (
    <Card className={cn('p-4', forsenad && 'border-red-200 bg-red-50')}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          forsenad ? 'bg-red-100' : 'bg-[var(--c-bg)]'
        )}>
          <Ikon className={cn('w-5 h-5', forsenad ? 'text-red-600' : 'text-[var(--c-text)]')} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-stone-900">{handelse.titel}</h4>
              <p className="text-sm text-stone-700">{handelse.typtext}</p>
            </div>
            {paminnelseId && (
              <button
                onClick={() => onKlar(paminnelseId)}
                aria-label={t('applications.detail.markDoneAria', { title: handelse.titel })}
                title={t('applications.common.markDone', 'Markera som klar')}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors text-stone-600 hover:text-green-600 flex-shrink-0"
              >
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Kalendern sa aldrig VILKEN ansökan påminnelsen gällde */}
          {handelse.ansokan && (
            <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{handelse.ansokan}</span>
            </p>
          )}

          {handelse.beskrivning && (
            <p className="text-sm text-stone-600 mt-1">{handelse.beskrivning}</p>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-stone-700">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {visaDatum && (
              <span>
                {franDagnyckel(handelse.dag).toLocaleDateString(i18n.language, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            )}
            {handelse.tid && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {handelse.tid}
              </span>
            )}
            {forsenad && (
              <span className="text-red-600 font-medium">
                {t('applications.calendar.overdueBadge', 'Har passerat')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ============================================
// MÅNADSRUTNÄT
// ============================================

/** Veckor med lokala Date, måndag först. `null` = tom cell före/efter månaden. */
function byggVeckor(ankare: Date): (Date | null)[][] {
  const ar = ankare.getFullYear()
  const manad = ankare.getMonth()
  const antalDagar = new Date(ar, manad + 1, 0).getDate()
  // getDay(): 0 = söndag. Vi vill ha måndag som kolumn 0.
  const forskjutning = (new Date(ar, manad, 1).getDay() + 6) % 7

  const celler: (Date | null)[] = []
  for (let i = 0; i < forskjutning; i++) celler.push(null)
  for (let d = 1; d <= antalDagar; d++) celler.push(new Date(ar, manad, d))
  while (celler.length % 7 !== 0) celler.push(null)

  const veckor: (Date | null)[][] = []
  for (let i = 0; i < celler.length; i += 7) veckor.push(celler.slice(i, i + 7))
  return veckor
}

function Manadsrutnat({
  manad,
  idag,
  valdDag,
  handelserPerDag,
  onValjDag,
  onBytManad
}: {
  manad: Date
  idag: string
  valdDag: string
  handelserPerDag: Map<string, Handelse[]>
  onValjDag: (nyckel: string) => void
  onBytManad: (ny: Date) => void
}) {
  const { t, i18n } = useTranslation()
  const [fokusDag, setFokusDag] = useState(valdDag)
  const dagRefs = useRef(new Map<string, HTMLButtonElement>())
  const flyttaFokus = useRef(false)

  /**
   * Den dag som bär `tabIndex={0}`.
   *
   * Måste alltid ligga i den månad som ritas — annars finns ingen cell att
   * tabba till och rutnätet blir onåbart med tangentbord. Det HÄRLEDS under
   * render i stället för att synkas i en effekt: en `setState` i en effekt
   * ger en extra renderomgång och fälls dessutom av `react-hooks/set-state-in-effect`.
   */
  const fokusDatum = franDagnyckel(fokusDag)
  const fokusIManaden = fokusDatum.getFullYear() === manad.getFullYear()
    && fokusDatum.getMonth() === manad.getMonth()
  const idagDatum = franDagnyckel(idag)
  const idagIManaden = idagDatum.getFullYear() === manad.getFullYear()
    && idagDatum.getMonth() === manad.getMonth()
  const aktivFokusDag = fokusIManaden
    ? fokusDag
    : dagnyckel(idagIManaden ? idagDatum : new Date(manad.getFullYear(), manad.getMonth(), 1))

  useEffect(() => {
    if (!flyttaFokus.current) return
    flyttaFokus.current = false
    dagRefs.current.get(fokusDag)?.focus()
  }, [fokusDag])

  const veckor = useMemo(() => byggVeckor(manad), [manad])

  const veckodagar = useMemo(() => {
    const kort = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' })
    const langt = new Intl.DateTimeFormat(i18n.language, { weekday: 'long' })
    // 2024-01-01 var en måndag.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i)
      return { kort: stortForsta(kort.format(d)), langt: stortForsta(langt.format(d)) }
    })
  }, [i18n.language])

  const manadsrubrik = useMemo(
    () => stortForsta(manad.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })),
    [manad, i18n.language]
  )

  const flytta = useCallback((nyttDatum: Date) => {
    flyttaFokus.current = true
    setFokusDag(dagnyckel(nyttDatum))
    if (nyttDatum.getFullYear() !== manad.getFullYear() || nyttDatum.getMonth() !== manad.getMonth()) {
      onBytManad(new Date(nyttDatum.getFullYear(), nyttDatum.getMonth(), 1))
    }
  }, [manad, onBytManad])

  const hanteraTangent = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const nuvarande = franDagnyckel(aktivFokusDag)
    const stegDagar = (antal: number) => {
      const ny = new Date(nuvarande)
      ny.setDate(ny.getDate() + antal)
      return ny
    }

    let nytt: Date
    switch (event.key) {
      case 'ArrowLeft': nytt = stegDagar(-1); break
      case 'ArrowRight': nytt = stegDagar(1); break
      case 'ArrowUp': nytt = stegDagar(-7); break
      case 'ArrowDown': nytt = stegDagar(7); break
      // Måndag respektive söndag i samma vecka.
      case 'Home': nytt = stegDagar(-((nuvarande.getDay() + 6) % 7)); break
      case 'End': nytt = stegDagar(6 - ((nuvarande.getDay() + 6) % 7)); break
      case 'PageUp': nytt = new Date(nuvarande.getFullYear(), nuvarande.getMonth() - 1, 1); break
      case 'PageDown': nytt = new Date(nuvarande.getFullYear(), nuvarande.getMonth() + 1, 1); break
      default: return
    }

    event.preventDefault()
    flytta(nytt)
  }

  const hoppaTillIdag = () => {
    onBytManad(new Date(idagDatum.getFullYear(), idagDatum.getMonth(), 1))
    onValjDag(idag)
    flytta(idagDatum)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          type="button"
          onClick={() => onBytManad(new Date(manad.getFullYear(), manad.getMonth() - 1, 1))}
          aria-label={t('applications.calendar.prevMonth', 'Visa föregående månad')}
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-700"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <h3 id="kalender-manad" className="text-base font-semibold text-stone-900" aria-live="polite">
          {manadsrubrik}
        </h3>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={hoppaTillIdag}
            className="px-3 py-2 rounded-lg hover:bg-stone-100 text-sm text-stone-700"
          >
            {t('applications.calendar.jumpToToday', 'Idag')}
          </button>
          <button
            type="button"
            onClick={() => onBytManad(new Date(manad.getFullYear(), manad.getMonth() + 1, 1))}
            aria-label={t('applications.calendar.nextMonth', 'Visa nästa månad')}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-700"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div role="grid" aria-labelledby="kalender-manad" onKeyDown={hanteraTangent}>
        <div role="row" className="grid grid-cols-7 gap-1 mb-1">
          {veckodagar.map(dag => (
            <div
              key={dag.langt}
              role="columnheader"
              aria-label={dag.langt}
              className="text-xs text-stone-700 text-center py-1"
            >
              <span aria-hidden="true">{dag.kort}</span>
            </div>
          ))}
        </div>

        {veckor.map((vecka, veckoIndex) => (
          <div
            role="row"
            key={`${manad.getFullYear()}-${manad.getMonth()}-v${veckoIndex}`}
            className="grid grid-cols-7 gap-1"
          >
            {vecka.map((datum, dagIndex) => {
              if (!datum) {
                return <div role="gridcell" key={`tom-${veckoIndex}-${dagIndex}`} className="py-1" />
              }
              const nyckel = dagnyckel(datum)
              const dagensHandelser = handelserPerDag.get(nyckel) ?? []
              const arIdag = nyckel === idag
              const arVald = nyckel === valdDag
              const harForsenat = nyckel < idag && dagensHandelser.some(h => h.paminnelseId)
              const langtDatum = datum.toLocaleDateString(i18n.language, {
                weekday: 'long', day: 'numeric', month: 'long'
              })

              return (
                <div role="gridcell" key={nyckel} aria-selected={arVald} className="py-0.5">
                  <button
                    ref={element => {
                      if (element) dagRefs.current.set(nyckel, element)
                      else dagRefs.current.delete(nyckel)
                    }}
                    type="button"
                    tabIndex={nyckel === aktivFokusDag ? 0 : -1}
                    aria-current={arIdag ? 'date' : undefined}
                    aria-label={dagensHandelser.length > 0
                      ? t('applications.calendar.dayAriaBusy', '{{date}} — du har något inplanerat', { date: langtDatum })
                      : t('applications.calendar.dayAriaFree', '{{date}} — inget inplanerat', { date: langtDatum })}
                    onClick={() => {
                      flyttaFokus.current = false
                      setFokusDag(nyckel)
                      onValjDag(nyckel)
                    }}
                    className={cn(
                      'w-full min-h-[44px] rounded-lg flex flex-col items-center justify-center gap-1',
                      'text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
                      arVald && 'bg-[var(--c-solid)] text-white font-semibold',
                      !arVald && arIdag && 'bg-[var(--c-bg)] text-[var(--c-text)] font-semibold',
                      !arVald && !arIdag && 'text-stone-700 hover:bg-stone-100',
                      !arVald && harForsenat && 'ring-1 ring-red-300'
                    )}
                  >
                    <span>{datum.getDate()}</span>
                    <span className="flex gap-0.5 h-1.5" aria-hidden="true">
                      {dagensHandelser.slice(0, 3).map(handelse => (
                        <span
                          key={handelse.id}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            arVald ? 'bg-white' : harForsenat ? 'bg-red-500' : 'bg-[var(--c-solid)]'
                          )}
                        />
                      ))}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ============================================
// FLIKEN
// ============================================

export function ApplicationsCalendar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const {
    reminders,
    isLoading: laddarPaminnelser,
    isError: felPaminnelser,
    refetch: hamtaPaminnelserIgen,
    completeReminder
  } = useApplicationReminders()

  const {
    byId,
    applications,
    isLoading: laddarAnsokningar,
    isError: felAnsokningar,
    refetch: hamtaAnsokningarIgen
  } = useApplicationLookup()

  const [idag] = useState(() => dagnyckel(new Date()))
  const [valdDag, setValdDag] = useState(idag)
  const [manad, setManad] = useState(() => {
    const nu = new Date()
    return new Date(nu.getFullYear(), nu.getMonth(), 1)
  })

  const handelser = useMemo<Handelse[]>(() => {
    const lista: Handelse[] = []

    for (const paminnelse of reminders) {
      const konfig = typkonfig(paminnelse.reminderType)
      lista.push({
        id: `paminnelse-${paminnelse.id}`,
        dag: dagnyckelAv(paminnelse.reminderDate),
        tid: paminnelse.reminderTime ? paminnelse.reminderTime.slice(0, 5) : null,
        titel: paminnelse.title,
        typtext: t(`applications.calendar.types.${paminnelse.reminderType}`, konfig.label),
        ikon: konfig.icon,
        ansokan: ansokansetikett(byId.get(paminnelse.applicationId)),
        beskrivning: paminnelse.description ?? null,
        paminnelseId: paminnelse.id
      })
    }

    // Intervjudatumen på ansökningarna hade noll läsare i hela portalen.
    for (const ansokan of applications) {
      if (!ansokan.interviewDate || ansokan.archivedAt) continue
      lista.push({
        id: `intervju-${ansokan.id}`,
        dag: dagnyckelAv(ansokan.interviewDate),
        tid: lokalTid(ansokan.interviewDate),
        titel: t('applications.calendar.interviewTitle', 'Intervju'),
        typtext: t('applications.calendar.fromApplication', 'Från din ansökan'),
        ikon: Users,
        ansokan: ansokansetikett(ansokan),
        beskrivning: null,
        paminnelseId: null
      })
    }

    return lista.sort((a, b) =>
      a.dag === b.dag
        ? (a.tid || '99:99').localeCompare(b.tid || '99:99')
        : a.dag.localeCompare(b.dag)
    )
  }, [reminders, applications, byId, t])

  const handelserPerDag = useMemo(() => {
    const karta = new Map<string, Handelse[]>()
    for (const handelse of handelser) {
      const rad = karta.get(handelse.dag)
      if (rad) rad.push(handelse)
      else karta.set(handelse.dag, [handelse])
    }
    return karta
  }, [handelser])

  // Före 2026-08-19 hämtades "idag" med `.eq(reminder_date, today)` och
  // "kommande" filtrerades med `> idag` — en påminnelse från i går fanns i
  // datan men ritades ingenstans, så `isOverdue` och texten "Försenad" var
  // oåtkomlig kod. Jämförelserna är nu strängjämförelser mellan dygnsnycklar.
  // Bara påminnelser hamnar här: en intervju som varit är inte något man
  // ligger efter med, den skulle bara skräpa överst.
  const forsenade = useMemo(
    () => handelser.filter(h => h.dag < idag && h.paminnelseId),
    [handelser, idag]
  )

  const narmastFramat = useMemo(
    () => handelser.filter(h => h.dag > idag).slice(0, 5),
    [handelser, idag]
  )

  const dagensUrval = handelserPerDag.get(valdDag) ?? []

  const hanteraKlar = async (id: string) => {
    try {
      await completeReminder(id)
      showToast.success(t('applications.calendar.completedToast', 'Klart — påminnelsen är avbockad'))
    } catch {
      // Tidigare bara console.error: deltagaren klickade och ingenting hände.
      showToast.error(
        t('applications.calendar.completeErrorTitle', 'Påminnelsen kunde inte bockas av'),
        t('applications.common.tryAgainLater', 'Kolla din uppkoppling och försök igen om en stund.')
      )
    }
  }

  const tillAnsokningar = () => navigate('/applications')

  // Tre uttryckliga lägen. Tidigare fanns bara två, och ett trasigt anrop
  // ritades som "Allt klart för idag!".
  if (laddarPaminnelser || laddarAnsokningar) {
    return (
      <div className="space-y-6 pb-24">
        <SkeletonList count={4} />
      </div>
    )
  }

  if (felPaminnelser || felAnsokningar) {
    return (
      <div className="pb-24">
        <ErrorState
          title={t('applications.calendar.errorTitle', 'Kalendern kunde inte hämtas')}
          message={t('applications.calendar.errorMessage', 'Vi når inte dina tider just nu. Det är inget du gjort fel — försök igen om en stund.')}
          onRetry={() => {
            void hamtaPaminnelserIgen()
            void hamtaAnsokningarIgen()
          }}
        />
      </div>
    )
  }

  const valdDagRubrik = valdDag === idag
    ? t('applications.calendar.today', 'Idag')
    : stortForsta(franDagnyckel(valdDag).toLocaleDateString(i18n.language, {
      weekday: 'long', day: 'numeric', month: 'long'
    }))

  return (
    // pb-24: den fixerade "Öppna mina samlingar"-knappen (z-40) ligger annars
    // ovanpå sista kortet.
    <div className="space-y-6 pb-24">
      {forsenade.length > 0 && (
        <section aria-labelledby="kalender-forsenade">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
            <h2 id="kalender-forsenade" className="text-lg font-semibold text-stone-900">
              {t('applications.calendar.overdueHeading', 'Det här har passerat')}
            </h2>
          </div>
          <p className="text-sm text-stone-700 mb-3">
            {t('applications.calendar.overdueLead', 'Ingen brådska — de ligger kvar tills du bockat av dem.')}
          </p>
          <div className="space-y-3">
            {forsenade.map(handelse => (
              <HandelseKort key={handelse.id} handelse={handelse} forsenad visaDatum onKlar={hanteraKlar} />
            ))}
          </div>
        </section>
      )}

      <Manadsrutnat
        manad={manad}
        idag={idag}
        valdDag={valdDag}
        handelserPerDag={handelserPerDag}
        onValjDag={setValdDag}
        onBytManad={setManad}
      />

      {handelser.length === 0 ? (
        // Ett tomtillstånd på skärmen, inte två staplade. Rutnätet ovanför är
        // ingen tomvy — det är kalendern.
        <EmptyState
          icon={Calendar}
          title={t('applications.calendar.emptyTitle', 'Här samlas dina tider')}
          description={t('applications.calendar.emptyDescription', 'Intervjuer och påminnelser du lägger till i en ansökan dyker upp i kalendern — så slipper du hålla datumen i huvudet.')}
          action={{
            label: t('applications.calendar.emptyAction', 'Öppna dina ansökningar'),
            onClick: tillAnsokningar
          }}
        />
      ) : (
        <section aria-labelledby="kalender-vald-dag">
          <h2 id="kalender-vald-dag" className="text-lg font-semibold text-stone-900 mb-3">
            {valdDagRubrik}
          </h2>
          {dagensUrval.length === 0 ? (
            <Card className="p-2">
              <EmptyState
                compact
                icon={Calendar}
                title={t('applications.calendar.dayEmptyTitle', 'Här är det lugnt')}
                description={t('applications.calendar.dayEmptyDescription', 'Du har inget inplanerat den här dagen. Tider lägger du till inifrån en ansökan.')}
                action={{
                  label: t('applications.calendar.emptyAction', 'Öppna dina ansökningar'),
                  onClick: tillAnsokningar
                }}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {dagensUrval.map(handelse => (
                <HandelseKort
                  key={handelse.id}
                  handelse={handelse}
                  forsenad={handelse.dag < idag && !!handelse.paminnelseId}
                  onKlar={hanteraKlar}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {narmastFramat.length > 0 && (
        <section aria-labelledby="kalender-framat">
          <h2 id="kalender-framat" className="text-lg font-semibold text-stone-900 mb-3">
            {t('applications.calendar.upcomingHeading', 'Närmast framåt')}
          </h2>
          <div className="space-y-3">
            {narmastFramat.map(handelse => (
              <HandelseKort key={handelse.id} handelse={handelse} visaDatum onKlar={hanteraKlar} />
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-stone-600">
        {t('applications.calendar.rangeNote', 'Påminnelser visas fram till 30 dagar framåt. Intervjudatum visas hur långt fram de än ligger.')}
      </p>
    </div>
  )
}

export default ApplicationsCalendar
