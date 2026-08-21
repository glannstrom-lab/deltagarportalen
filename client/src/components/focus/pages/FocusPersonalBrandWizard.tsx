/**
 * FocusPersonalBrandWizard — NPF-anpassad personlig varumärkesbyggare.
 *
 * Steg: tre adjektiv → en mening om vem du är (tagline) → "om mig"-stycke.
 *
 * VAD SOM VAR FEL TILL 2026-08-21: guiden sparade ingenting. `handleNext` var
 * `async` utan `await`, filen innehöll varken `Api.`, `supabase` eller
 * `localStorage`, och slutsteget sa
 *
 *   "Fint! Du kan kopiera och använda din 'om mig' på LinkedIn och i CV."
 *
 * — utan att visa texten och utan kopieringsknapp. I samma sekund användaren
 * tryckte "Klar" anropades `onExit()`, komponenten avmonterades, och tre
 * skrivsteg om sig själv var borta. För en utmattad person som orkat skriva
 * ett "om mig"-stycke är det sidans värsta enskilda beteende.
 *
 * Nu sparas texten som en pitch i `elevator_pitches` — samma tabell och
 * samma skrivväg som Pitch-fliken använder, så den dyker upp där i
 * normalläge. Slutsteget visar texten med en kopieringsknapp, och
 * misslyckas sparningen stängs guiden inte.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Star, MessageSquare, FileText, Smile, Copy, Check } from '@/components/ui/icons'
import { personalBrandApi } from '@/services/cloudStorage'
import { showToast } from '@/components/Toast'
import { FOCUS_WIZARD_TITLE_ID, FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusPersonalBrandWizard({ onExit }: Props) {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [adjectives, setAdjectives] = useState('')
  const [tagline, setTagline] = useState('')
  const [about, setAbout] = useState('')
  const [sparad, setSparad] = useState(false)
  const [kopierad, setKopierad] = useState(false)

  /** Texten som faktiskt går att använda — den vi visar och sparar. */
  const fardigText = [tagline.trim(), about.trim()].filter(Boolean).join('\n\n')

  const sparaMutation = useMutation({
    mutationFn: async () => {
      const ord = adjectives
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)

      await personalBrandApi.addPitch({
        title: t('focus.personalBrand.savedTitle', 'Om mig — skriven i fokusläge'),
        content: fardigText,
        // 30 sekunder är pitchflikens eget standardval, inte en mätning av
        // just den här texten.
        duration_seconds: 30,
        pitch_type: 'general',
        key_points: ord,
      })
    },
    onSuccess: () => setSparad(true),
  })

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'adjectives',
      icon: Star,
      title: t('focus.personalBrand.adjTitle', 'Tre ord som beskriver dig'),
      hint: t('focus.personalBrand.adjHint', 'Separera med komma. T.ex. lugn, lojal, ordningsam.'),
    },
    {
      id: 'tagline',
      icon: MessageSquare,
      title: t('focus.personalBrand.taglineTitle', 'En kort mening om dig'),
      hint: t('focus.personalBrand.taglineHint', 'Vad är du bra på? Hur hjälper du andra?'),
    },
    {
      id: 'about',
      icon: FileText,
      title: t('focus.personalBrand.aboutTitle', 'Berätta lite mer om dig'),
      hint: t('focus.personalBrand.aboutHint', '3-5 meningar räcker. Vi använder det som "om mig".'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.personalBrand.doneTitle', 'Här är din text'),
      hint: t('focus.personalBrand.doneHint', 'Läs igenom. Vi sparar den bland dina pitchar.'),
    },
  ] as const

  const current = STEPS[step]

  const handleNext = async () => {
    if (current.id !== 'done') {
      setStep((s) => s + 1)
      return
    }

    if (sparad) {
      onExit()
      return
    }

    try {
      await sparaMutation.mutateAsync()
      onExit()
    } catch (err) {
      // Stängde tidigare oavsett utfall — här finns inget utfall att stänga
      // på förrän texten är på plats någonstans.
      console.error('Kunde inte spara varumärkestexten', err)
      showToast.error(
        t('focus.personalBrand.saveFailed', 'Kunde inte spara texten. Den ligger kvar här — försök igen.')
      )
    }
  }

  const kopiera = async () => {
    try {
      await navigator.clipboard.writeText(fardigText)
      setKopierad(true)
      window.setTimeout(() => setKopierad(false), 2000)
    } catch {
      // `navigator.clipboard` saknas i osäker kontext, och behörigheten kan
      // nekas. Bocken visades tidigare ändå på andra ytor i portalen.
      showToast.error(
        t('focus.personalBrand.copyFailed', 'Kunde inte kopiera. Markera texten och kopiera för hand.')
      )
    }
  }

  const canNext = current.id === 'adjectives'
    ? adjectives.trim().length > 0
    : current.id === 'tagline'
      ? tagline.trim().length > 0
      : current.id === 'about'
        ? about.trim().length > 0
        : true

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={canNext}
      busy={sparaMutation.isPending}
      finishLabel={
        sparad
          ? t('focus.personalBrand.closeCta', 'Stäng')
          : t('focus.personalBrand.saveCta', 'Spara texten')
      }
    >
      {current.id === 'adjectives' && (
        <input
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
          type="text"
          value={adjectives}
          onChange={(e) => setAdjectives(e.target.value)}
          placeholder={t('focus.personalBrand.adjPlaceholder', 'lugn, lojal, ordningsam')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'tagline' && (
        <textarea
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          rows={3}
          placeholder={t('focus.personalBrand.taglinePlaceholder', 't.ex. Jag är en noggrann administratör som hjälper team att hålla ordning.')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'about' && (
        <textarea
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={8}
          placeholder={t('focus.personalBrand.aboutPlaceholder', 'Skriv som du skulle berätta för en vän...')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <div className="space-y-4">
          {/* Texten VISAS. Slutsteget sa tidigare att den gick att kopiera,
              utan att någonsin skriva ut den. */}
          <p className="whitespace-pre-wrap text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-4">
            {fardigText}
          </p>

          <button
            type="button"
            onClick={kopiera}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            {kopierad
              ? <Check className="w-4 h-4" aria-hidden="true" />
              : <Copy className="w-4 h-4" aria-hidden="true" />}
            {kopierad
              ? t('focus.personalBrand.copied', 'Kopierad')
              : t('focus.personalBrand.copy', 'Kopiera texten')}
          </button>

          <p className="text-sm text-stone-600 dark:text-stone-300">
            {sparad
              ? t('focus.personalBrand.savedText', 'Sparad bland dina pitchar. Du hittar den under Personligt varumärke i normalläge.')
              : t('focus.personalBrand.saveHint', 'Tryck på Spara texten så finns den kvar bland dina pitchar.')}
          </p>
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusPersonalBrandWizard
