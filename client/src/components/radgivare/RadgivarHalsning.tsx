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

import { useTranslation } from 'react-i18next'
import { avkodaSokvag } from '@/lib/sokvag'
import { datumSprak } from '@/lib/datumsprak'
import { getPageKeyForPath } from '@/data/coaches'
import { SIDHALSNINGAR, OVERSIKT_STEG, OVERSIKT_INGET } from '@/data/radgivarHalsningar'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { valjNastaSteg } from '@/pages/hubs/nastaStegRegler'
import { nastaStegTexter } from '@/pages/hubs/nastaStegTexter'
import { Dialogruta, type Replik } from '@/components/varld/Dialogruta'

/*
 * Spår JS (2026-10-09): kortet är numera Dialogrutan — rådgivaren som en
 * karaktär i Jobin-staden. Uppspelningen bor i components/varld/rost.ts och
 * utseendet i Dialogruta.tsx. Den här filen väljer bara VAD som sägs.
 */

type Variant = 'flytande' | 'kort'

function forstaMeningMedTal(text: string): string | undefined {
  const forsta = text.split(/(?<=[.!?])\s+/)[0]
  return /\d/.test(forsta) ? forsta : undefined
}

// ── Översikt: klippet följer valt nästa steg ───────────────────────────────

function OversiktHalsning({ variant, vidByte }: { variant: Variant; vidByte?: (stegId: string | null) => void }) {
  const { t, i18n } = useTranslation()
  const sprak = i18n.language?.startsWith('en') ? 'en' : 'sv'
  const { data, isLoading, isError } = useOversiktHubSummary()
  // Tre lägen: medan svaret inte är inne vet vi inget om användaren, och då
  // ska ingen säga något om hen (CLAUDE.md, "laddning är inte tomhet").
  if (isLoading || isError || !data) return null
  const val = valjNastaSteg(data)
  if (!val) {
    return (
      <Dialogruta
        coachId={OVERSIKT_INGET.coachId}
        variant={variant}
        repliker={[{ nyckel: 'oversikt-inget', text: OVERSIKT_INGET[sprak], knapp: null }]}
      />
    )
  }
  const steg = [val.primar, ...val.alternativ]
  const ds = datumSprak(i18n.language)
  const repliker: Replik[] = steg.map((s) => {
    const tx = nastaStegTexter(s, t, ds)
    return {
      nyckel: `oversikt-${s.id}`,
      text: OVERSIKT_STEG[s.id][sprak],
      // Bara det personliga ("Det har gått 9 dagar."): brödtextens första
      // mening när den bär en siffra. Resten säger repliken redan.
      detalj: forstaMeningMedTal(tx.body),
      knapp: { text: tx.knapp, till: s.till },
    }
  })
  return (
    <Dialogruta
      key={val.primar.id}
      coachId={OVERSIKT_STEG[val.primar.id].coachId}
      variant={variant}
      repliker={repliker}
      vidByte={vidByte ? (i) => vidByte(steg[i]?.till ?? null) : undefined}
    />
  )
}

// ── Ingången ───────────────────────────────────────────────────────────────

export default function RadgivarHalsning({
  pathname,
  variant = 'kort',
  vidByte,
}: {
  pathname: string
  /** @deprecated Kolumnplaceringen är borta (spår JS). Ignoreras. */
  iKolumn?: boolean
  variant?: Variant
  /** Bara Översikt: meddelar målrutten för den replik som visas. */
  vidByte?: (till: string | null) => void
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
  // `key` = sidan: en ny ruta per sida, så att uppspelning, hopfällning och
  // "redan hörd" börjar om. Layouten monterar inte om vid klientnavigering.
  if (sidnyckel === 'dashboard') return <OversiktHalsning key="dashboard" variant={variant} vidByte={vidByte} />
  const h = SIDHALSNINGAR[sidnyckel]
  if (!h) return null
  return (
    <Dialogruta
      key={sidnyckel}
      coachId={h.coachId}
      variant={variant}
      repliker={[
        {
          nyckel: sidnyckel,
          text: h[sprak],
          knapp: h.steg?.till && !sammaSida(h.steg.till) ? { text: h.steg[sprak], till: h.steg.till } : null,
        },
      ]}
    />
  )
}
