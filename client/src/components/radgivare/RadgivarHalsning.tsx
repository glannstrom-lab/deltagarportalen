/**
 * Rådgivaren hälsar — med röst — och pekar ut nästa steg.  (2026-10-09)
 *
 * Beslut Mikael 2026-10-09: rådgivarna ska vara mer aktiva. När man kommer
 * till en sida säger sidans första rådgivare kort vad sidan är till för och
 * vad som är ett bra första steg, med en knapp dit. Rösten är på som
 * standard och stängs av under Inställningar → Utseende.
 *
 * ── Varför klippen är förinspelade ─────────────────────────────────────────
 *
 * Texterna bor i `data/radgivarHalsningar.ts` och ljudet i
 * `public/radgivare/ljud/<nyckel>-<sv|en>.mp3`, inspelat en gång med
 * ElevenLabs. Ingenting om användaren lämnar webbläsaren: ett dynamiskt
 * uppläst "Hej Anna, du har fem ansökningar" hade gjort ElevenLabs till ett
 * nytt personuppgiftsbiträde (samma fälla som Perplexity, se CLAUDE.md). På
 * Översikt väljs klippet efter vilket nästa steg reglerna valde — samma
 * `valjNastaSteg` som kortet — så rösten säger samma sak som sidan.
 *
 * ── Tre regler för ljud som startar av sig själv ───────────────────────────
 *
 *  1. WCAG 1.4.2: ljud som spelar mer än 3 s utan att användaren bett om det
 *     måste kunna stoppas. Pausknappen står synlig medan klippet spelar, och
 *     klippet tystnar när man lämnar sidan.
 *  2. En gång per sida och session. Den som går fram och tillbaka mellan två
 *     sidor ska inte höra samma mening tio gånger — andra gången står
 *     hälsningen hopfälld till en rad, med knappen kvar.
 *  3. Webbläsaren bestämmer. Före första klicket på sajten blockerar alla
 *     stora webbläsare uppspelning med ljud. Det är inget fel: då står
 *     "Lyssna" kvar, och efter första klicket (en SPA-navigering räknas)
 *     fungerar resten av besöket.
 *
 * Lugnare läge spelar aldrig upp av sig själv — den som valt lugn har valt
 * bort det som drar uppmärksamhet. Knappen finns kvar.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Pause, Volume2, X } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { avkodaSokvag } from '@/lib/sokvag'
import { COACHES, getPageKeyForPath, type CoachId } from '@/data/coaches'
import {
  SIDHALSNINGAR,
  OVERSIKT_STEG,
  OVERSIKT_INGET,
  ljudFor,
} from '@/data/radgivarHalsningar'
import { useInnehall } from '@/data/oversattningar'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { valjNastaSteg } from '@/pages/hubs/nastaStegRegler'

// ── Vilka klipp har hörts den här sessionen ────────────────────────────────

const HORDA = 'jobin-radgivare-hord'

function lasHorda(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(HORDA) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function markeraHord(nyckel: string) {
  try {
    const s = lasHorda()
    s.add(nyckel)
    sessionStorage.setItem(HORDA, JSON.stringify([...s]))
  } catch {
    // Privat läge eller blockerad lagring: då kan hälsningen komma igen.
    // Det är det mindre felet jämfört med att aldrig höras.
  }
}

// ── Uppspelningen ──────────────────────────────────────────────────────────

type Lage = 'tyst' | 'spelar' | 'klar'

/**
 * Ett Audio-element per hälsning. Försöker spela när `autostart` är satt;
 * avvisar webbläsaren står läget kvar på 'tyst' och knappen gör jobbet.
 * Saknas filen (404, nytt språk utan inspelning) döljs ljudknappen — texten
 * räcker då ensam.
 */
function useRost(src: string, autostart: boolean, nyckel: string) {
  const ref = useRef<HTMLAudioElement | null>(null)
  // Tillståndet bär vilken fil det gäller. Byts filen (språkbyte) gäller det
  // gamla läget inte längre — utan att någon effekt behöver nollställa det.
  const [tillstand, setTillstand] = useState<{ src: string; lage: Lage }>({ src, lage: 'tyst' })
  const [saknasFor, setSaknasFor] = useState<string | null>(null)
  const lage: Lage = tillstand.src === src ? tillstand.lage : 'tyst'
  const saknas = saknasFor === src
  const setSaknas = useCallback(() => setSaknasFor(src), [src])

  useEffect(() => {
    const a = new Audio(src)
    a.preload = autostart ? 'auto' : 'none'
    ref.current = a
    const setLage = (l: Lage) => setTillstand({ src, lage: l })
    const onPlay = () => setLage('spelar')
    const onPause = () => setTillstand((t) => (t.src === src && t.lage === 'spelar' ? { src, lage: 'tyst' } : t))
    const onEnded = () => {
      setLage('klar')
      markeraHord(nyckel)
    }
    const onError = () => setSaknasFor(src)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnded)
    a.addEventListener('error', onError)

    let avbruten = false
    if (autostart) {
      // Ett kort andrum så att sidan hinner ritas innan någon börjar prata.
      const t = window.setTimeout(() => {
        if (avbruten) return
        a.play().catch(() => {
          /* Blockerat av webbläsaren — knappen finns. */
        })
      }, 600)
      return () => {
        avbruten = true
        window.clearTimeout(t)
        a.pause()
        a.src = ''
        a.removeEventListener('play', onPlay)
        a.removeEventListener('pause', onPause)
        a.removeEventListener('ended', onEnded)
        a.removeEventListener('error', onError)
      }
    }
    return () => {
      a.pause()
      a.src = ''
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('error', onError)
    }
  }, [src, autostart, nyckel])

  const vaxla = useCallback(() => {
    const a = ref.current
    if (!a) return
    if (!a.paused) {
      a.pause()
      return
    }
    if (a.ended) a.currentTime = 0
    a.play().catch(() => setSaknas())
  }, [setSaknas])

  return { lage, saknas, vaxla }
}

// ── Kortet ─────────────────────────────────────────────────────────────────

interface KortProps {
  nyckel: string
  coachId: CoachId
  text: string
  steg: { text: string; till: string } | null
  iKolumn: boolean
}

function HalsningsKort({ nyckel, coachId, text, steg, iKolumn }: KortProps) {
  const { t, i18n } = useTranslation()
  const sprak = i18n.language?.startsWith('en') ? 'en' : 'sv'
  const COACHES_T = useInnehall('coaches', COACHES, 'COACHES')
  const coach = COACHES_T[coachId]

  const rostPa = useSettingsStore((s) => s.radgivarRost)
  const lugnt = useSettingsStore((s) => s.calmMode)

  // Läses en gång per hälsning — inte vid varje rendering, annars fäller
  // hälsningen ihop sig själv i samma ögonblick som klippet tar slut.
  const [redanHord] = useState(() => lasHorda().has(nyckel))
  const [oppen, setOppen] = useState(!redanHord)
  const autostart = rostPa && !lugnt && !redanHord

  const { lage, saknas, vaxla } = useRost(ljudFor(nyckel, sprak), autostart, nyckel)
  const spelar = lage === 'spelar'

  const ljudEtikett = spelar
    ? t('radgivare.halsning.pauseShort', 'Pausa')
    : lage === 'klar'
      ? t('radgivare.halsning.again', 'Lyssna igen')
      : t('radgivare.halsning.listenShort', 'Lyssna')
  /**
   * Ljudknappen. Med synlig etikett i det öppna kortet — en ensam högtalarikon
   * är en gissning för den som inte är van vid appar. I den hopfällda raden
   * räcker ikonen; där bär aria-label namnet.
   */
  const ljudknapp = (kompakt: boolean) =>
    !saknas && (
      <button
        type="button"
        onClick={vaxla}
        aria-pressed={spelar}
        aria-label={
          kompakt
            ? spelar
              ? t('radgivare.halsning.pause', 'Pausa {{namn}}', { namn: coach.name })
              : t('radgivare.halsning.listen', 'Lyssna på {{namn}}', { namn: coach.name })
            : undefined
        }
        className={cn(
          'shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full',
          kompakt ? 'w-9 h-9' : 'h-9 px-3.5 text-[0.875rem] font-medium',
          'border border-[var(--c-accent)] bg-white dark:bg-stone-900 text-[var(--c-text)] dark:text-[var(--c-solid)]',
          'hover:bg-[var(--c-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]'
        )}
      >
        {spelar ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
        {!kompakt && ljudEtikett}
      </button>
    )

  const avatar = (storlek: 'liten' | 'mellan' | 'stor') => (
    <span className="relative shrink-0">
      <img
        src={storlek === 'liten' ? coach.avatarSm : coach.avatar}
        alt=""
        aria-hidden="true"
        className={cn(
          'rounded-full object-cover',
          storlek === 'liten' ? 'w-8 h-8' : storlek === 'mellan' ? 'w-11 h-11' : 'w-12 h-12'
        )}
      />
      {/* Ringen säger "talar nu" utan att vara enda bäraren av det —
          knappens etikett ("Pausa") säger samma sak. */}
      {spelar && (
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-full ring-2 ring-[var(--c-solid)] motion-safe:animate-pulse"
        />
      )}
    </span>
  )

  // Hopfälld: en rad. Andra besöket på sidan, eller när man stängt kortet.
  if (!oppen) {
    return (
      <div
        data-domain={coach.accent}
        data-testid="radgivar-halsning"
        className="flex items-center gap-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2"
      >
        {avatar('liten')}
        <button
          type="button"
          onClick={() => setOppen(true)}
          aria-expanded={false}
          className="min-w-0 flex-1 text-left text-[0.875rem] text-stone-700 dark:text-stone-300 truncate hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] rounded"
        >
          <span className="font-semibold text-stone-900 dark:text-stone-100">{coach.name}: </span>
          {steg ? steg.text : text}
        </button>
        {ljudknapp(true)}
      </div>
    )
  }

  /*
   * Öppet kort. Namnraden överst och texten i full bredd under — i den 300 px
   * smala kolumnen gav en avatar till vänster om texten en spalt på fyra ord
   * per rad. Under xl står kortet överst i innehållet och ska därför vara
   * lågt: mindre avatar, och text + knappar i samma flöde.
   */
  return (
    <section
      data-domain={coach.accent}
      data-testid="radgivar-halsning"
      aria-label={t('radgivare.halsning.label', '{{namn}} hälsar', { namn: coach.name })}
      className="rounded-xl border border-[var(--c-accent)] bg-[var(--c-bg)] dark:bg-stone-900 p-4"
    >
      <div className="flex items-center gap-3">
        {avatar(iKolumn ? 'stor' : 'mellan')}
        <p className="m-0 min-w-0 flex-1 leading-tight">
          <span className="block text-[0.9375rem] font-semibold text-stone-900 dark:text-stone-100">{coach.name}</span>
          <span className="block text-[0.8125rem] text-stone-600 dark:text-stone-400">{coach.role}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            if (spelar) vaxla()
            markeraHord(nyckel)
            setOppen(false)
          }}
          aria-label={t('radgivare.halsning.close', 'Fäll ihop')}
          className="shrink-0 -mr-1 -mt-1 self-start inline-flex items-center justify-center w-8 h-8 rounded-full text-stone-500 hover:bg-white/70 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Ingen aria-live här med flit: en skärmläsare som läser texten
          samtidigt som rösten talar ger två röster i munnen på varandra. */}
      <p className="m-0 mt-3 text-[0.9375rem] leading-relaxed text-stone-800 dark:text-stone-200 max-w-[68ch]">
        {text}
      </p>

      {(steg || !saknas) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {steg && (
            <Link
              to={steg.till}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--c-solid)] px-4 py-2 text-[0.90625rem] font-semibold text-[var(--c-on-solid)] no-underline transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
            >
              {steg.text}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
          {ljudknapp(false)}
        </div>
      )}
    </section>
  )
}

// ── Översikt: klippet följer valt nästa steg ───────────────────────────────

function OversiktHalsning({ iKolumn }: { iKolumn: boolean }) {
  const { i18n } = useTranslation()
  const sprak = i18n.language?.startsWith('en') ? 'en' : 'sv'
  const { data, isLoading, isError } = useOversiktHubSummary()
  // Tre lägen: medan svaret inte är inne vet vi inget om användaren, och då
  // ska ingen säga något om hen (CLAUDE.md, "laddning är inte tomhet").
  if (isLoading || isError || !data) return null
  const val = valjNastaSteg(data)
  if (!val) {
    return (
      <HalsningsKort
        nyckel="oversikt-inget"
        coachId={OVERSIKT_INGET.coachId}
        text={OVERSIKT_INGET[sprak]}
        steg={null}
        iKolumn={iKolumn}
      />
    )
  }
  const h = OVERSIKT_STEG[val.primar.id]
  return (
    <HalsningsKort
      key={val.primar.id}
      nyckel={`oversikt-${val.primar.id}`}
      coachId={h.coachId}
      text={h[sprak]}
      steg={null}
      iKolumn={iKolumn}
    />
  )
}

// ── Ingången ───────────────────────────────────────────────────────────────

export default function RadgivarHalsning({
  pathname,
  iKolumn = true,
}: {
  pathname: string
  iKolumn?: boolean
}) {
  const { i18n } = useTranslation()
  const sprak = i18n.language?.startsWith('en') ? 'en' : 'sv'
  // /externa-resurser delar rådgivarnyckel med /resources (Dina sparade
  // resurser) i radgivarRutter.ts — panelens råd passar båda, men en hälsning
  // som säger "här hamnar det du sparar" stämmer inte på en länksamling.
  const sidnyckel = avkodaSokvag(pathname).startsWith('/externa-resurser')
    ? 'externalResources'
    : getPageKeyForPath(pathname)
  if (!sidnyckel) return null
  const sammaSida = (till: string) => avkodaSokvag(till.split(/[?#]/)[0]) === avkodaSokvag(pathname)
  // `key` = sidan: ett nytt kort per sida, så att uppspelning, hopfällning och
  // "redan hörd" börjar om. Layouten monterar inte om vid klientnavigering.
  if (sidnyckel === 'dashboard') return <OversiktHalsning key="dashboard" iKolumn={iKolumn} />
  const h = SIDHALSNINGAR[sidnyckel]
  if (!h) return null
  return (
    <HalsningsKort
      key={sidnyckel}
      nyckel={sidnyckel}
      coachId={h.coachId}
      text={h[sprak]}
      steg={h.steg?.till && !sammaSida(h.steg.till) ? { text: h.steg[sprak], till: h.steg.till } : null}
      iKolumn={iKolumn}
    />
  )
}
