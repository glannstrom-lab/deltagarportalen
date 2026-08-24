/**
 * Externa resurser — 264 länkar vidare ut från portalen.
 *
 * Datan bor i `data/externaResurser.ts`. Fram till 2026-08-23 låg den här,
 * och filen var 3 580 rader varav 3 216 var listan.
 *
 * ## Vad granskningen 2026-08-23 rättade
 *
 * - **Alla fem flikar såg likadana ut.** Varje kategori startade hopfälld, så
 *   oavsett vald flik syntes exakt åtta länkar — de utvalda överst, som är
 *   desamma på alla flikar. 315 av 323 länkar låg bakom ett klick, och
 *   "Visa alla" gav en sida på 14 419 px. Nu öppnas avsnitten när man väljer
 *   en flik, och urvalet överst visas bara på "Alla". Uppmätt efter:
 *   86 / 41 / 59 / 59 / 19 synliga länkar per flik, mot 8 på varje förut.
 * - **87 av 323 länkar var trasiga** — 27 %. 61 poster med avregistrerad,
 *   parkerad eller svarslös domän är borta, 26 fick en ny adress som
 *   verifierats med ett riktigt anrop, och 18 följde en flytt till ny domän.
 *   Kvar: 264 länkar som svarade när de skrevs in.
 * - **Noll träffar gav en tom sida.** "Hittade 0 resurser" och sedan
 *   ansvarsfriskrivningen, ingenting däremellan. DESIGN.md §7 kräver
 *   `EmptyState` med ikon, mänsklig rubrik och EN väg vidare.
 * - **Accordionen saknade `aria-expanded` och `aria-controls`,** och
 *   kategorititlarna var `<span>`. En skärmläsare fick 35 namnlösa sektioner
 *   och inget besked om att en knapp öppnade något.
 * - **Träffräkningen annonserades inte** (WCAG 4.1.3). Den som söker hör
 *   ingenting förrän hen letar upp texten manuellt.
 * - **Sexton hårdkodade svenska strängar** plus 70 i kategorierna. Filen
 *   importerade `useTranslation` och gjorde ett enda `t()`-anrop — mot en
 *   nyckel som inte fanns i språkfilerna.
 * - **`dark:border-[var(--c-accent)]/50/50`** — dubbelt opacitetssuffix. Hela
 *   klassen föll bort, så urvalssektionen saknade ram i mörkt läge.
 * - **`categoryLabels[category]` destrukturerades utan reserv.** En kategori
 *   utan post kraschade sidan i stället för att sakna rubrik.
 *
 * ## Det som INTE ändrades, med flit
 *
 * Sökningen söker i alla resurser oavsett vald flik, och flikraden döljs
 * medan man söker. Det är avsiktligt: den som skriver "a-kassa" vill inte
 * missa träffen för att hen råkade stå på fliken Lärande. Skenan står kvar —
 * `PageLayout` visar den så länge `title` finns — det är bara flikknapparna
 * som tas bort.
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Input, EmptyState } from '@/components/ui'
import { ExternalLink, Search, X, ChevronDown, Sparkles } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusExternalResourcesWizard } from '@/components/focus/pages/FocusExternalResourcesWizard'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'
import {
  EXTERNA_RESURSER,
  HUVUDFLIKAR,
  UTVALDA_IDN,
  kategoriTitel,
  kategoriBeskrivning,
  type ExternalResource,
} from '@/data/externaResurser'
import { useInnehall } from '@/data/oversattningar'

const ALLA = 'alla'

/**
 * Ett kort i ett kategoriavsnitt.
 *
 * Beskrivningen låg tidigare i `truncate` — en enda rad. Beskrivningarna är i
 * median 49 tecken och kortets textyta rymmer ungefär 30, så varje kort i
 * varje kategori var avhugget mitt i meningen. Tre rader rymmer den längsta
 * beskrivningen i listan (107 tecken) — och det är just villkoren, "kräver
 * att du sagts upp från en anställning med kollektivavtal", som annars är
 * det första som kapas bort.
 */
function ResursKort({ resource, nyFlik }: { resource: ExternalResource; nyFlik: string }) {
  const Ikon = resource.icon

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700/50 hover:border-[var(--c-solid)]/60 dark:hover:border-[var(--c-solid)] hover:shadow-md transition-all"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--c-bg)] flex items-center justify-center">
        <Ikon className="w-5 h-5 text-[var(--c-text)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          <span className="font-medium text-sm text-stone-900 dark:text-stone-100 group-hover:text-[var(--c-text)]">
            {resource.name}
          </span>
          <ExternalLink className="w-3 h-3 mt-1 text-stone-500 flex-shrink-0" aria-hidden="true" />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3">
          {resource.description}
        </p>
      </div>
      {/* WCAG 3.2.5. Alla 323 korten öppnar ny flik; ingenting sa det. */}
      <span className="sr-only"> ({nyFlik})</span>
    </a>
  )
}

/** Ett av korten i urvalet överst. Större, med tre rader beskrivning. */
function UtvaltKort({ resource, nyFlik }: { resource: ExternalResource; nyFlik: string }) {
  const Ikon = resource.icon

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/50 hover:border-[var(--c-solid)]/60 dark:hover:border-[var(--c-solid)] hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--c-accent)]/40 flex items-center justify-center">
          <Ikon className="w-6 h-6 text-[var(--c-text)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {/* 15 px, inte 16: "Arbetsförmedlingens" är 19 tecken och bröts som
                "Arbetsförmedlingen / s guider" i den smala kolumnen. */}
            <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-stone-900 dark:text-stone-100 break-words group-hover:text-[var(--c-text)]">
              {resource.name}
            </h3>
            <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 text-stone-500" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 line-clamp-3">
            {resource.description}
          </p>
        </div>
      </div>
      <span className="sr-only"> ({nyFlik})</span>
    </a>
  )
}

/**
 * Ett kategoriavsnitt.
 *
 * Rubriken är en `h3` runt knappen, inte en `span` inuti den: sidan gick
 * tidigare h1 → h2 → h3 (urvalskorten) och sedan 35 sektioner utan rubrik
 * alls. `aria-expanded`/`aria-controls` band knappen till panelen först
 * 2026-08-23 — före det annonserades ingen öppning och inget tillstånd.
 */
function Kategoriavsnitt({
  kategori,
  resurser,
  oppen,
  vidVaxling,
  nyFlik,
}: {
  kategori: string
  resurser: ExternalResource[]
  oppen: boolean
  vidVaxling: () => void
  nyFlik: string
}) {
  const { t } = useTranslation()
  const knappId = `avsnitt-knapp-${kategori}`
  const panelId = `avsnitt-panel-${kategori}`

  return (
    <div className="border border-stone-200 dark:border-stone-700/50 rounded-xl overflow-hidden">
      <h3 className="m-0">
        <button
          id={knappId}
          type="button"
          onClick={vidVaxling}
          aria-expanded={oppen}
          aria-controls={panelId}
          className="w-full flex items-center justify-between gap-3 p-4 min-h-[56px] bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
        >
          <span className="flex items-center gap-3">
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {kategoriTitel(t, kategori)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--c-accent)]/40 text-[var(--c-text)]">
              {resurser.length}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`w-5 h-5 shrink-0 text-stone-500 transition-transform ${oppen ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      {oppen && (
        <div id={panelId} role="region" aria-labelledby={knappId} className="p-4 pt-0 bg-white dark:bg-stone-900">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            {kategoriBeskrivning(t, kategori)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resurser.map((resource) => (
              <ResursKort key={resource.id} resource={resource} nyFlik={nyFlik} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExternalResources() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('externalResources.title', 'Externa resurser')}
      icon={ExternalLink}
      domain="info"
      guide={<FocusExternalResourcesWizard onExit={leaveWizard} />}
    >
      <ExternalResourcesInner />
    </FokusVaxel>
  )
}

function ExternalResourcesInner() {
  const { t } = useTranslation()
  // Namn, beskrivningar och taggar översätts; `category` och `id` är nycklar
  // och rörs inte — grupperingen nedan bygger på dem.
  const resurser = useInnehall('externaResurser', EXTERNA_RESURSER, 'EXTERNA_RESURSER')
  const [sokning, setSokning] = useState('')
  const [aktivFlik, setAktivFlik] = useState<string>(ALLA)
  const [oppnaAvsnitt, setOppnaAvsnitt] = useState<Set<string>>(new Set())

  const soker = sokning.trim().length > 0
  const nyFlik = t('externalResources.opensInNewTab', 'öppnas i ny flik')

  const traffar = useMemo(() => {
    const q = sokning.trim().toLowerCase()
    if (!q) return resurser
    return resurser.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags?.some((tag) => tag.toLowerCase().includes(q))
    )
  }, [sokning, resurser])

  const perKategori = useMemo(() => {
    const grupper: Record<string, ExternalResource[]> = {}
    for (const r of traffar) {
      ;(grupper[r.category] ??= []).push(r)
    }
    return grupper
  }, [traffar])

  const utvalda = useMemo(
    () =>
      UTVALDA_IDN.map((id) => resurser.find((r) => r.id === id)).filter(
        (r): r is ExternalResource => r !== undefined
      ),
    [resurser]
  )

  const aktivaKategorier = useMemo(
    () =>
      aktivFlik === ALLA
        ? HUVUDFLIKAR.flatMap((f) => f.kategorier)
        : (HUVUDFLIKAR.find((f) => f.id === aktivFlik)?.kategorier ?? []),
    [aktivFlik]
  )

  const synligaKategorier = aktivaKategorier.filter((k) => perKategori[k]?.length)

  /**
   * Att välja en flik öppnar dess avsnitt.
   *
   * Före 2026-08-23 startade allt hopfällt, och eftersom urvalet överst var
   * detsamma på varje flik såg alla fem flikar identiska ut — åtta synliga
   * länkar, oavsett val. "Alla" lämnas hopfälld: 35 öppna avsnitt på en gång
   * är den 14 000 px långa sidan som var det andra felet.
   */
  const valjFlik = (id: string) => {
    setAktivFlik(id)
    const flik = HUVUDFLIKAR.find((f) => f.id === id)
    setOppnaAvsnitt(new Set(flik ? flik.kategorier : []))
  }

  const vaxlaAvsnitt = (kategori: string) => {
    setOppnaAvsnitt((forra) => {
      const nasta = new Set(forra)
      if (nasta.has(kategori)) nasta.delete(kategori)
      else nasta.add(kategori)
      return nasta
    })
  }

  const antalOppna = synligaKategorier.filter((k) => oppnaAvsnitt.has(k)).length

  return (
    <PageLayout
      title={t('externalResources.title', 'Externa resurser')}
      description={t('externalResources.subtitle', {
        count: resurser.length,
        defaultValue: '{{count}} länkar vi samlat åt dig',
      })}
      icon={ExternalLink}
      domain="info"
      className="space-y-6"
      sidoflikar={
        soker
          ? undefined
          : {
              poster: [
                { id: ALLA, etikett: t('externalResources.tabs.all', 'Alla') },
                ...HUVUDFLIKAR.map((f) => ({
                  id: f.id,
                  etikett: t(f.etikettNyckel, f.reservEtikett),
                })),
              ],
              aktiv: aktivFlik,
              vidVal: valjFlik,
            }
      }
    >
      {/* Sökfältet är `Input`, inte en handbyggd `<input>` med egen ram och
          egen fokusring. Samma rättelse som Kunskapsbanken fick 2026-08-22. */}
      <div role="search">
        <Input
          id="external-resources-search"
          type="search"
          // Chrome ritar ett eget kryss i `type="search"`. Tillsammans med
          // vårt egna blev det två kryss bredvid varandra, varav bara det ena
          // hade ett namn för skärmläsare.
          className="[&::-webkit-search-cancel-button]:hidden"
          value={sokning}
          onChange={(e) => setSokning(e.target.value)}
          label={t('externalResources.searchLabel', 'Sök bland resurserna')}
          placeholder={t('externalResources.searchPlaceholder', 'Sök bland resurser...')}
          leftIcon={<Search className="w-5 h-5" />}
          rightIcon={
            sokning ? (
              <button
                type="button"
                onClick={() => setSokning('')}
                aria-label={t('externalResources.clearSearch', 'Rensa sökningen')}
                className="p-2 -m-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            ) : undefined
          }
          touchOptimized
        />
      </div>

      {/* WCAG 4.1.3. Räknaren uppdaterades tyst vid varje tangenttryck. */}
      <p role="status" aria-live="polite" className="text-sm text-stone-600 dark:text-stone-400 min-h-[1.25rem]">
        {soker
          ? t('externalResources.resultsCount', {
              count: traffar.length,
              query: sokning.trim(),
              defaultValue: '{{count}} resurser för ”{{query}}”',
            })
          : antalOppna > 0
            ? t('externalResources.sectionsOpen', {
                count: antalOppna,
                defaultValue: '{{count}} avsnitt är öppna',
              })
            : ''}
      </p>

      {soker ? (
        traffar.length === 0 ? (
          <EmptyState
            illustration="resurser"
            title={t('externalResources.emptyTitle', 'Vi hittade ingen resurs som matchar')}
            description={t(
              'externalResources.emptyDescription',
              'Prova ett kortare sökord, eller bläddra bland avsnitten i listan.'
            )}
            action={{
              label: t('externalResources.clearSearch', 'Rensa sökningen'),
              onClick: () => setSokning(''),
              variant: 'outline',
            }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {traffar.map((resource) => (
              <ResursKort key={resource.id} resource={resource} nyFlik={nyFlik} />
            ))}
          </div>
        )
      ) : (
        <>
          {/* Urvalet hör hemma på "Alla". På en vald flik upprepade det bara
              samma åtta kort ovanför flikens egna avsnitt. */}
          {aktivFlik === ALLA && (
            <section
              aria-labelledby="utvalda-rubrik"
              className="bg-[var(--c-bg)] rounded-xl p-5 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
                </div>
                <h2 id="utvalda-rubrik" className="font-semibold text-stone-900 dark:text-stone-100">
                  {t('externalResources.featuredHeading', 'Bra att börja med')}
                </h2>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                {t(
                  'externalResources.featuredNote',
                  'Ett urval vi gjort åt dig — öppna för alla och utan kostnad.'
                )}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {utvalda.map((resource) => (
                  <UtvaltKort key={resource.id} resource={resource} nyFlik={nyFlik} />
                ))}
              </div>
            </section>
          )}

          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setOppnaAvsnitt(new Set(synligaKategorier))}
              className="px-3 py-2 rounded-lg text-[var(--c-text)] font-medium hover:bg-[var(--c-bg)] transition-colors"
            >
              {t('externalResources.expandAll', 'Öppna alla avsnitt')}
            </button>
            <button
              type="button"
              onClick={() => setOppnaAvsnitt(new Set())}
              className="px-3 py-2 rounded-lg text-stone-600 dark:text-stone-400 font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {t('externalResources.collapseAll', 'Stäng alla avsnitt')}
            </button>
          </div>

          <div className="space-y-4">
            {synligaKategorier.map((kategori) => (
              <Kategoriavsnitt
                key={kategori}
                kategori={kategori}
                resurser={perKategori[kategori]}
                oppen={oppnaAvsnitt.has(kategori)}
                vidVaxling={() => vaxlaAvsnitt(kategori)}
                nyFlik={nyFlik}
              />
            ))}
          </div>
        </>
      )}

      <p className="text-center py-6 px-4 text-sm text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50">
        {t(
          'externalResources.disclaimer',
          'Länkarna tar dig vidare till andra webbplatser. Vad som står där är inte något vi styr över.'
        )}
      </p>
    </PageLayout>
  )
}
