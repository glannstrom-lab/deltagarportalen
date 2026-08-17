/**
 * Översiktens instrumentpanel.  (Steg 3, "Översikt A", 2026-08-17)
 *
 * Ersätter de fyra hub-korten. Skälet: sidan hämtade redan CV, ansökningar,
 * intervjuövningar, måendekurva, kommande händelser, karriärmål och konsulent
 * via `useOversiktHubSummary` — och visade inget av det. Med den tvåradiga
 * toppnaven är hub-korten dessutom en upprepning av rad 1.
 *
 * ── Två regler som styrt varje ruta ────────────────────────────────────────
 *
 * 1. **Ingen siffra utan underlag** (ROADMAP B31). Saknas data visas `—` och
 *    en rad om varför — aldrig 0, aldrig ett påhittat exempel. Skissen visade
 *    "CV klart 72 %"; den siffran finns inte. `useJobsokHubSummary` hämtar
 *    bara `id, updated_at` ur `cvs`, så `completion_pct` är alltid undefined.
 *    Rutan visar därför när CV:t senast ändrades, vilket är sant.
 *
 * 2. **Inga prestationsmätningar i hjälteposition.** DESIGN.md §1 avvisar
 *    uttryckligen "12 av 50 mål uppnådda" med hänvisning till målgruppens skam
 *    över att stå utanför arbetslivet. Talen här beskriver därför vad som
 *    FINNS ("3 ansökningar"), aldrig hur väl man presterar mot ett mål, och
 *    ingen ruta är röd för att ett tal är lågt.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'

/** En ruta i nyckeltalsremsan. `varde === null` betyder "vi vet inte". */
interface Nyckeltal {
  etikett: string
  varde: string | null
  /** Rad under talet. När `varde` är null ska den förklara varför. */
  under: string
  till: string
}

/** Kortar fritext vid ordgräns så en rad inte spränger layouten. */
function kortaTitel(text: string, max = 48): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  const kap = t.slice(0, max)
  const brytpunkt = kap.lastIndexOf(' ')
  return (brytpunkt > max * 0.5 ? kap.slice(0, brytpunkt) : kap).replace(/[\s,.;:–—-]+$/, '') + '…'
}

function dagarSedan(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}

function narText(iso: string | null | undefined, t: TFunction): string | null {
  const d = dagarSedan(iso)
  if (d === null) return null
  if (d <= 0) return t('hubOverview.panel.today', 'i dag')
  if (d === 1) return t('hubOverview.panel.yesterday', 'i går')
  if (d < 7) return t('hubOverview.panel.daysAgo', { defaultValue: '{{count}} dagar sedan', count: d })
  if (d < 30) return t('hubOverview.panel.weeksAgo', { defaultValue: '{{count}} veckor sedan', count: Math.floor(d / 7) })
  return t('hubOverview.panel.longAgo', 'för länge sedan')
}

function byggNyckeltal(s: OversiktSummary | undefined, t: TFunction): Nyckeltal[] {
  const appsTotalt = s?.jobsok?.applicationStats?.total ?? null
  const intervjuer = s?.jobsok?.interviewSessions?.length ?? null
  const cvNar = narText(s?.jobsok?.cv?.updated_at, t)
  const nastaHandelse = s?.minVardag?.upcomingEvents?.[0] ?? null
  const brev = s?.jobsok?.coverLetters?.length ?? null

  return [
    {
      etikett: t('hubOverview.panel.applications', 'Ansökningar'),
      varde: appsTotalt && appsTotalt > 0 ? String(appsTotalt) : null,
      under:
        appsTotalt && appsTotalt > 0
          ? t('hubOverview.panel.applicationsSub', 'sparade och skickade')
          : t('hubOverview.panel.applicationsNone', 'Du har inte börjat söka jobb än'),
      till: '/applications',
    },
    {
      etikett: t('hubOverview.panel.cv', 'Ditt CV'),
      varde: cvNar,
      under: cvNar
        ? t('hubOverview.panel.cvSub', 'senast ändrat')
        : t('hubOverview.panel.cvNone', 'Inte påbörjat än'),
      till: '/cv',
    },
    {
      etikett: t('hubOverview.panel.letters', 'Personliga brev'),
      varde: brev && brev > 0 ? String(brev) : null,
      under:
        brev && brev > 0
          ? t('hubOverview.panel.lettersSub', 'sparade')
          : t('hubOverview.panel.lettersNone', 'Inget skrivet än'),
      till: '/cover-letter',
    },
    {
      etikett: t('hubOverview.panel.interviews', 'Intervjuövning'),
      varde: intervjuer && intervjuer > 0 ? String(intervjuer) : null,
      under:
        intervjuer && intervjuer > 0
          ? t('hubOverview.panel.interviewsSub', 'genomförda')
          : t('hubOverview.panel.interviewsNone', 'Inte provat än'),
      till: '/interview-simulator',
    },
    {
      etikett: t('hubOverview.panel.next', 'Nästa'),
      varde: nastaHandelse?.date
        ? new Date(nastaHandelse.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric' })
        : null,
      under: nastaHandelse?.title || t('hubOverview.panel.nextNone', 'Inget inbokat'),
      till: '/calendar',
    },
  ]
}

export default function OversiktPanel({ summary }: { summary: OversiktSummary | undefined }) {
  const { t } = useTranslation()
  const nyckeltal = byggNyckeltal(summary, t)

  const pipeline = summary?.jobsok?.applicationStats?.segments ?? []
  const handelser = (summary?.minVardag?.upcomingEvents ?? []).slice(0, 4)
  const mood = summary?.minVardag?.recentMoodLogs ?? []
  const konsulent = summary?.minVardag?.consultant ?? null
  const analys = summary?.karriar?.latestSkillsAnalysis ?? null

  // Fortsätt där du var — bara poster som FINNS. Ingen fylls på med exempel.
  const fortsatt: Array<{ titel: string; under: string; nar: string | null; till: string; domain: string }> = []
  if (summary?.jobsok?.coverLetters?.[0]) {
    const b = summary.jobsok.coverLetters[0]
    fortsatt.push({
      titel: b.title || t('hubOverview.panel.untitledLetter', 'Personligt brev'),
      under: t('hubOverview.panel.letterSub', 'Du skrev senast här'),
      nar: narText(b.created_at, t),
      till: '/cover-letter',
      domain: 'activity',
    })
  }
  if (summary?.jobsok?.cv?.updated_at) {
    fortsatt.push({
      titel: t('hubOverview.panel.yourCv', 'Ditt CV'),
      under: t('hubOverview.panel.cvSub2', 'Öppna och fyll på'),
      nar: narText(summary.jobsok.cv.updated_at, t),
      till: '/cv',
      domain: 'activity',
    })
  }
  if (analys?.dream_job) {
    fortsatt.push({
      // dream_job är fritext och innehåller i prod ibland en HEL jobbannons
      // (sett 2026-08-17: 300+ tecken med arbetsuppgifter och krav). Kortas
      // vid ordgräns — raden ska rymma en titel, inte en annons.
      titel: t('hubOverview.panel.skillsFor', {
        defaultValue: 'Kompetenser mot {{jobb}}',
        jobb: kortaTitel(analys.dream_job),
      }),
      under: t('hubOverview.panel.skillsSub', 'Din senaste analys'),
      nar: narText(analys.created_at, t),
      till: '/skills-gap-analysis',
      domain: 'coaching',
    })
  }
  if (summary?.minVardag?.latestDiaryEntry) {
    fortsatt.push({
      titel: t('hubOverview.panel.diary', 'Din dagbok'),
      under: t('hubOverview.panel.diarySub', 'Senaste anteckningen'),
      nar: narText(summary.minVardag.latestDiaryEntry.created_at, t),
      till: '/diary',
      domain: 'wellbeing',
    })
  }

  const kortKlass =
    'rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900'
  const rubrikKlass =
    'flex items-center gap-2 px-4 py-2.5 border-b border-stone-200 dark:border-stone-700 text-[12px] font-semibold tracking-wide text-stone-700 dark:text-stone-200'

  return (
    <div className="space-y-4">
      {/* ---------- Nyckeltal ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-200 dark:bg-stone-700">
        {nyckeltal.map((n) => (
          <Link
            key={n.etikett}
            to={n.till}
            className="bg-white dark:bg-stone-900 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--c-solid)]"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {n.etikett}
            </p>
            <p
              className={
                n.varde
                  ? 'mt-1.5 text-[22px] font-semibold tabular-nums leading-none text-stone-900 dark:text-stone-100'
                  : 'mt-1.5 text-[22px] font-semibold leading-none text-stone-400 dark:text-stone-500'
              }
            >
              {/* B31: ett värde utan underlag visar tankstreck, aldrig 0. */}
              {n.varde ?? '—'}
            </p>
            <p className="mt-1.5 text-[11.5px] leading-snug text-stone-500 dark:text-stone-400">
              {n.under}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* ---------- Vänster ---------- */}
        <div className="space-y-4">
          <section className={kortKlass}>
            <h2 className={rubrikKlass}>
              {t('hubOverview.panel.continue', 'Fortsätt där du var')}
            </h2>
            {fortsatt.length === 0 ? (
              <p className="px-4 py-5 text-[13.5px] text-stone-600 dark:text-stone-300">
                {t(
                  'hubOverview.panel.continueEmpty',
                  'Du har inte börjat med något än. Det är helt okej — välj en sak i raden ovanför när du orkar.'
                )}
              </p>
            ) : (
              <ul className="divide-y divide-stone-200 dark:divide-stone-700">
                {fortsatt.map((f) => (
                  <li key={f.till}>
                    <Link
                      to={f.till}
                      data-domain={f.domain}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--c-solid)]"
                    >
                      {/* DESIGN.md §14: färgen kommer ur --c-solid, som
                          data-domain ovan sätter. Aldrig en hårdkodad
                          hub-token — grinden lint:design fäller det. */}
                      <span
                        aria-hidden="true"
                        className="w-1 h-8 rounded-full shrink-0 bg-[var(--c-solid)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium text-stone-900 dark:text-stone-100 truncate">
                          {f.titel}
                        </span>
                        <span className="block text-[11.5px] text-stone-500 dark:text-stone-400">
                          {f.under}
                        </span>
                      </span>
                      {f.nar && (
                        <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 shrink-0">
                          {f.nar}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {pipeline.length > 0 && (
            <section className={kortKlass}>
              <h2 className={rubrikKlass}>
                {t('hubOverview.panel.pipeline', 'Dina ansökningar')}
                <Link
                  to="/applications"
                  className="ml-auto text-[11.5px] font-normal text-[var(--c-text)] dark:text-[var(--c-solid)]"
                >
                  {t('hubOverview.panel.showAll', 'Visa alla')}
                </Link>
              </h2>
              <div
                className="grid gap-px bg-stone-200 dark:bg-stone-700"
                style={{ gridTemplateColumns: `repeat(${Math.min(pipeline.length, 5)}, minmax(0, 1fr))` }}
              >
                {pipeline.map((seg) => (
                  <div key={seg.label} className="bg-white dark:bg-stone-900 px-3 py-2.5">
                    <span className="block text-[17px] font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                      {seg.count}
                    </span>
                    <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                      {seg.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ---------- Höger ---------- */}
        <div className="space-y-4">
          <section className={kortKlass}>
            <h2 className={rubrikKlass}>{t('hubOverview.panel.thisWeek', 'Framöver')}</h2>
            {handelser.length === 0 ? (
              <p className="px-4 py-5 text-[13.5px] text-stone-600 dark:text-stone-300">
                {t('hubOverview.panel.weekEmpty', 'Inget inbokat just nu.')}
              </p>
            ) : (
              <ul className="divide-y divide-stone-200 dark:divide-stone-700">
                {handelser.map((h) => (
                  <li key={h.id} className="px-4 py-2.5">
                    <span className="block text-[13.5px] font-medium text-stone-900 dark:text-stone-100 truncate">
                      {h.title}
                    </span>
                    <span className="block text-[11.5px] text-stone-500 dark:text-stone-400">
                      {new Date(h.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })}
                      {h.time ? ` · ${h.time}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {mood.length >= 3 && (
            <section className={kortKlass} data-domain="wellbeing">
              <h2 className={rubrikKlass}>{t('hubOverview.panel.mood', 'Hur du mått')}</h2>
              <div className="px-4 pt-3 pb-1 flex items-end gap-1 h-12" aria-hidden="true">
                {mood.slice(0, 14).reverse().map((m, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${Math.max(8, (m.mood_level / 5) * 100)}%`,
                      background: 'var(--c-solid)',
                      opacity: 0.45 + (m.mood_level / 5) * 0.4,
                    }}
                  />
                ))}
              </div>
              <p className="px-4 pb-3 text-[11.5px] text-stone-500 dark:text-stone-400">
                {t('hubOverview.panel.moodSub', {
                  defaultValue: 'Senaste {{count}} loggningarna',
                  count: mood.length,
                })}
              </p>
            </section>
          )}

          {konsulent && (
            <section className={kortKlass}>
              <h2 className={rubrikKlass}>{t('hubOverview.panel.consultant', 'Din konsulent')}</h2>
              <Link
                to="/my-consultant"
                className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--c-solid)]"
              >
                <span className="w-8 h-8 rounded-full bg-[var(--c-bg)] text-[var(--c-text)] grid place-items-center text-[12px] font-semibold shrink-0">
                  {konsulent.full_name?.trim()[0]?.toUpperCase() ?? '?'}
                </span>
                <span className="text-[13.5px] text-stone-900 dark:text-stone-100 truncate">
                  {konsulent.full_name ?? t('hubOverview.panel.consultantUnnamed', 'Din konsulent')}
                </span>
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
