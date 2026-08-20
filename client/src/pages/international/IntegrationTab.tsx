/**
 * Din första tid i Sverige — checklista med rätt ordning.
 *
 * Vad som var fel och som inte får återinföras:
 *
 * 1. **Sakfel med konsekvenser.** Personnummer var något man "ansöker om" på
 *    "Dag 1-2" (man anmäler flytt, det tar veckor, kräver personligt besök och
 *    minst ett års planerad vistelse). SFI låg "Vecka 1-4" trots att rätten
 *    kräver folkbokföring. Bankkonto beskrevs som bankens godtycke fast rätten
 *    till betalkonto är lagstadgad inom EES. Skattepunkten handlade om SINK,
 *    som per definition inte gäller den som folkbokförts.
 * 2. **Ordningen saknades.** Kategorierna var tidsbaserade, inte
 *    beroendebaserade, och motsade sig själva: BankID lovades på 2-4 veckor
 *    men kräver personnummer, som sidans egen ruta sa tar 2-8 veckor. Nu är
 *    kategorierna beroenden — "Börja här", "När du har personnummer".
 * 3. **Checklistan gick inte att bocka av med tangentbord.** Varje rad var en
 *    `<div onClick>` utan roll, tabIndex eller aria-checked. Sidans enda
 *    interaktiva funktion var stängd för skärmläsare.
 * 4. **Ett misslyckat sparande såg ut som ett lyckat.** Returvärdet från
 *    `saveProgress` kastades och den optimistiska uppdateringen rullades aldrig
 *    tillbaka. En användare vars skrivning nekades såg fjorton gröna bockar
 *    som bara fanns i minnet.
 * 5. **localStorage-fallbacken markerade ALLT som klart.** `!!objekt` är alltid
 *    sant, och blocket läste det nya formatet som om det vore det gamla.
 *
 * Alla myndighetslänkar kontrollerade 2026-08-20 (HTTP 200). Den gamla
 * Skatteverket-länken var en 404 — och den satt på den punkt allt annat hänger
 * på.
 */
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ChevronUp, ExternalLink, Info, AlertCircle } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { integrationChecklistApi } from '@/services/cloudStorage'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { KONTROLLERAD } from '../International'

interface Punkt {
  id: string
  /** Gäller bara den som inte är EU/EES- eller nordisk medborgare. */
  endastTredjeland?: boolean
  url?: string
}

interface Kategori {
  nyckel: 'start' | 'afterId' | 'work' | 'later'
  punkter: Punkt[]
}

/**
 * Ordningen är beroendeordning, inte kalender. Nästan allt i "När du har
 * personnummer" är omöjligt innan folkbokföringen är klar — det var precis det
 * den gamla tidsindelningen dolde.
 *
 * Id:na är också nycklar för sparade kryss (`user_preferences.integration_checklist`).
 * Byter du ett id nollställs den punkten för alla som redan kryssat den.
 */
const KATEGORIER: Kategori[] = [
  {
    nyckel: 'start',
    punkter: [
      { id: 'folkbokforing', url: 'https://www.skatteverket.se/privat/folkbokforing/flyttatillsverige' },
      { id: 'samordningsnummer', url: 'https://www.skatteverket.se/privat/folkbokforing' },
      { id: 'arbetsformedlingen', url: 'https://arbetsformedlingen.se/for-arbetssokande' },
    ],
  },
  {
    nyckel: 'afterId',
    punkter: [
      { id: 'idkort', url: 'https://www.skatteverket.se/privat/folkbokforing' },
      { id: 'bankkonto', url: 'https://www.arn.se/' },
      { id: 'bankid' },
      { id: 'forsakringskassan', url: 'https://www.forsakringskassan.se/' },
      { id: 'vardcentral', url: 'https://www.1177.se/' },
      { id: 'sfi', url: 'https://www.skolverket.se/undervisning/komvux/komvux-i-svenska-for-invandrare-sfi' },
    ],
  },
  {
    nyckel: 'work',
    punkter: [
      { id: 'validering', url: 'https://www.uhr.se/bedomning-av-utlandsk-utbildning/' },
      { id: 'akassa' },
      { id: 'skatt', url: 'https://www.skatteverket.se/' },
    ],
  },
  {
    nyckel: 'later',
    punkter: [
      { id: 'korkort', url: 'https://www.transportstyrelsen.se/sv/korkort/' },
      { id: 'pension', url: 'https://www.pensionsmyndigheten.se/' },
    ],
  },
]

const ALLA_PUNKTER = KATEGORIER.flatMap(k => k.punkter)

interface SparadPunkt {
  id: string
  completed: boolean
  completedAt?: string
  notes?: string
  targetDate?: string
}

export default function IntegrationTab() {
  const { t, i18n } = useTranslation()
  const [sparat, setSparat] = useState<Record<string, SparadPunkt>>({})
  const [laddar, setLaddar] = useState(true)
  const [sparfel, setSparfel] = useState(false)
  const [oppen, setOppen] = useState<string | null>(null)
  const [redigerar, setRedigerar] = useState<string | null>(null)
  const [utkast, setUtkast] = useState('')

  useEffect(() => {
    let avbruten = false
    integrationChecklistApi
      .getProgress()
      .then((data) => {
        if (avbruten) return
        setSparat(data?.items ?? {})
      })
      .catch((error: unknown) => {
        logger.warn('Kunde inte läsa integrationschecklistan', { error })
      })
      .finally(() => {
        if (!avbruten) setLaddar(false)
      })
    return () => { avbruten = true }
  }, [])

  /** Skriver hela mängden och rullar tillbaka om molnet säger nej. */
  const spara = async (nasta: Record<string, SparadPunkt>) => {
    const forra = sparat
    setSparat(nasta)
    setSparfel(false)
    try {
      const ok = await integrationChecklistApi.saveProgress(nasta)
      if (!ok) {
        setSparat(forra)
        setSparfel(true)
      }
    } catch (error) {
      logger.warn('Kunde inte spara integrationschecklistan', { error })
      setSparat(forra)
      setSparfel(true)
    }
  }

  const vaxlaKryss = (id: string) => {
    const klar = !sparat[id]?.completed
    void spara({
      ...sparat,
      [id]: {
        ...sparat[id],
        id,
        completed: klar,
        completedAt: klar ? new Date().toISOString() : undefined,
      },
    })
  }

  const sparaAnteckning = (id: string, text: string) => {
    void spara({
      ...sparat,
      [id]: { ...sparat[id], id, completed: sparat[id]?.completed ?? false, notes: text || undefined },
    })
    setRedigerar(null)
  }

  const sattDatum = (id: string, datum: string) => {
    void spara({
      ...sparat,
      [id]: { ...sparat[id], id, completed: sparat[id]?.completed ?? false, targetDate: datum || undefined },
    })
  }

  // Räknar bara punkter som finns i dagens lista. Tidigare räknades allt som
  // låg i molnet, så en borttagen punkt kunde ge "15/14 (107 %)".
  const antalKlara = useMemo(
    () => ALLA_PUNKTER.filter(p => sparat[p.id]?.completed).length,
    [sparat],
  )

  const sprak = i18n.language?.startsWith('en') ? 'en-GB' : 'sv-SE'

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-700 dark:text-stone-300">
        {t('international.integration.description')}
      </p>

      {/* Läs det här först — beroendena, överst i stället för längst ned */}
      <Card className="p-4 bg-[var(--c-bg)]/60 dark:bg-[var(--c-bg)]/20 border-[var(--c-accent)]/60">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
              {t('international.integration.firstNote.title')}
            </h2>
            <p className="text-sm text-stone-700 dark:text-stone-200">
              {t('international.integration.firstNote.body')}
            </p>
          </div>
        </div>
      </Card>

      {/* Framsteg — tre lägen. Laddning är inte tomhet, och en nolla är ett
          omdöme snarare än en uppgift (DESIGN.md §3 och §7). */}
      <div role="status" aria-live="polite">
        {laddar ? (
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {t('international.integration.loading')}
          </p>
        ) : (
          <>
            <p className="text-sm text-stone-700 dark:text-stone-200">
              {antalKlara === 0
                ? t('international.integration.emptyHint')
                : `${t('international.integration.yourProgress')} — ${t('international.integration.progressCount', { done: antalKlara, total: ALLA_PUNKTER.length })}`}
            </p>
            <div
              className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mt-2"
              role="progressbar"
              aria-valuenow={antalKlara}
              aria-valuemin={0}
              aria-valuemax={ALLA_PUNKTER.length}
              aria-label={t('international.integration.yourProgress')}
            >
              <div
                className="h-full bg-[var(--c-solid)] transition-all"
                style={{ width: `${(antalKlara / ALLA_PUNKTER.length) * 100}%` }}
              />
            </div>
          </>
        )}
      </div>

      {sparfel && (
        <Card className="p-3 bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600">
          <p className="flex items-start gap-2 text-sm text-stone-800 dark:text-stone-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {t('international.integration.saveFailed')}
          </p>
        </Card>
      )}

      {KATEGORIER.map((kategori) => (
        <section key={kategori.nyckel} className="space-y-3">
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">
            {t(`international.integration.categories.${kategori.nyckel}`)}
          </h2>

          <ul className="space-y-3">
            {kategori.punkter.map((punkt) => {
              const bas = `international.integration.items.${punkt.id}`
              const titel = t(`${bas}.title`)
              const klar = sparat[punkt.id]?.completed ?? false
              const utfalld = oppen === punkt.id
              const post = sparat[punkt.id]

              return (
                <li key={punkt.id}>
                  <Card className="p-0 overflow-hidden bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                    <div className="flex items-start gap-2 p-4">
                      {/* Kryssrutan är en riktig kontroll, och bara den är
                          klickyta — tidigare togglade hela kortet, så ett
                          klick i brödtexten bockade av punkten av misstag. */}
                      <button
                        role="checkbox"
                        aria-checked={klar}
                        onClick={() => vaxlaKryss(punkt.id)}
                        className="flex items-start gap-3 text-left flex-1 min-h-[44px]"
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center',
                            klar
                              ? 'bg-[var(--c-solid)] border-[var(--c-solid)]'
                              : 'border-stone-400 dark:border-stone-500',
                          )}
                          aria-hidden="true"
                        >
                          {klar && <Check className="w-3.5 h-3.5 text-white" />}
                        </span>
                        <span>
                          <span className={cn(
                            'block font-medium text-stone-900 dark:text-stone-100',
                            klar && 'line-through text-stone-600 dark:text-stone-400',
                          )}>
                            {titel}
                          </span>
                          {punkt.endastTredjeland && (
                            <span className="block text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                              {t('international.integration.onlyThirdCountry')}
                            </span>
                          )}
                        </span>
                      </button>

                      <button
                        onClick={() => setOppen(utfalld ? null : punkt.id)}
                        aria-expanded={utfalld}
                        aria-controls={`punkt-${punkt.id}`}
                        aria-label={utfalld
                          ? t('international.integration.hideDetails', { title: titel })
                          : t('international.integration.showDetails', { title: titel })}
                        className="p-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        {utfalld
                          ? <ChevronUp className="w-5 h-5 text-stone-500" aria-hidden="true" />
                          : <ChevronDown className="w-5 h-5 text-stone-500" aria-hidden="true" />}
                      </button>
                    </div>

                    <div id={`punkt-${punkt.id}`} hidden={!utfalld} className="px-4 pb-4 space-y-4">
                      <p className="text-sm text-stone-700 dark:text-stone-200">
                        {t(`${bas}.body`)}
                      </p>

                      {punkt.url && (
                        <a
                          href={punkt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline"
                        >
                          {t(`${bas}.linkLabel`)}
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          <span className="sr-only">{t('international.opensInNewTab')}</span>
                        </a>
                      )}

                      <div>
                        <label
                          htmlFor={`datum-${punkt.id}`}
                          className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1"
                        >
                          {t('international.integration.dateLabel')}
                        </label>
                        <input
                          id={`datum-${punkt.id}`}
                          type="date"
                          value={post?.targetDate ?? ''}
                          onChange={(e) => sattDatum(punkt.id, e.target.value)}
                          className="px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg text-stone-800 dark:text-stone-100"
                        />
                      </div>

                      <div>
                        {redigerar === punkt.id ? (
                          <>
                            <label
                              htmlFor={`anteckning-${punkt.id}`}
                              className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1"
                            >
                              {t('international.integration.notesLabel')}
                            </label>
                            <textarea
                              id={`anteckning-${punkt.id}`}
                              rows={3}
                              value={utkast}
                              onChange={(e) => setUtkast(e.target.value)}
                              placeholder={t('international.integration.notesPlaceholder')}
                              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg text-stone-800 dark:text-stone-100"
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* Tom text sparar också — det är så man raderar
                                  en anteckning. Tidigare returnerade Spara utan
                                  att göra någonting alls. */}
                              <Button size="sm" onClick={() => sparaAnteckning(punkt.id, utkast.trim())}>
                                {utkast.trim()
                                  ? t('international.integration.notesSave')
                                  : t('international.integration.notesClear')}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setRedigerar(null)}>
                                {t('international.integration.notesCancel')}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {post?.notes && (
                              <p className="text-sm text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-stone-700 rounded-lg p-3 mb-2 whitespace-pre-wrap">
                                {post.notes}
                              </p>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setRedigerar(punkt.id); setUtkast(post?.notes ?? '') }}
                            >
                              {post?.notes
                                ? t('international.integration.notesLabel')
                                : t('international.integration.notesAdd')}
                            </Button>
                          </>
                        )}
                      </div>

                      {klar && post?.completedAt && (
                        <p className="text-xs text-stone-600 dark:text-stone-400">
                          {t('international.integration.doneAt')}{' '}
                          {new Date(post.completedAt).toLocaleDateString(sprak)}
                        </p>
                      )}
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <p className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        {t('international.checkedNote', { date: KONTROLLERAD })}
      </p>
    </div>
  )
}
