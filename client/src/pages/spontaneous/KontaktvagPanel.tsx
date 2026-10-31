/**
 * KontaktvagPanel (KF14) — "Hitta kontaktväg" på företagskortet.
 *
 * Visar bara det som går att belägga, var och en med sin källa, och lägger
 * ingenting i kortet förrän deltagaren väljer det. Hämtar ingen webbsida.
 * Mejlutkastet är en fast mall: deltagaren fyller i och skickar själv.
 */
import { useTranslation } from 'react-i18next'
import { Mail, MapPin, Search, Plus, Copy } from 'lucide-react'
import { showToast } from '@/components/Toast'
import type { SpontaneousCompany } from '@/services/supabaseApi'
import { byggKontaktvagar, anteckningsRad, laggTillIAnteckningar } from './kontaktvagar'

export function KontaktvagPanel({
  company,
  onAddToNotes,
}: {
  company: SpontaneousCompany
  onAddToNotes: (notes: string) => void
}) {
  const { t } = useTranslation()
  const vagar = byggKontaktvagar(company)
  const adress = vagar.find(v => v.typ === 'postadress')
  const sok = vagar.find(v => v.typ === 'sokning')

  const utkastAmne = t('spontaneous.kontaktvag.draftSubject', 'Spontanansökan')
  const utkast = t('spontaneous.kontaktvag.draftBody', {
    company: company.company_name,
    defaultValue:
      'Hej!\n\nJag heter [ditt namn] och söker jobb. Jag är intresserad av att arbeta hos {{company}} och undrar om ni har någon tjänst som passar mig, eller om jag kan skicka in min ansökan till er.\n\nJag bifogar gärna mitt CV och personliga brev.\n\nVänliga hälsningar\n[ditt namn]',
  })

  const laggIAnteckningar = () => {
    if (!adress) return
    const rad = anteckningsRad(
      t('spontaneous.kontaktvag.postalAddress', 'Postadress'),
      t('spontaneous.kontaktvag.sourceBolagsverket', 'källa: Bolagsverket'),
      adress.varde
    )
    onAddToNotes(laggTillIAnteckningar(company.notes, rad))
    showToast.success(t('spontaneous.kontaktvag.addedToNotes', 'Lades till i dina anteckningar.'))
  }

  const kopiera = async () => {
    try {
      await navigator.clipboard.writeText(`${utkastAmne}\n\n${utkast}`)
      showToast.success(t('spontaneous.kontaktvag.copied', 'Utkastet är kopierat.'))
    } catch {
      showToast.error(
        t('spontaneous.kontaktvag.copyFailed', 'Det gick inte att kopiera. Markera texten och kopiera själv.')
      )
    }
  }

  const mailto = `mailto:${company.contact_email || ''}?subject=${encodeURIComponent(utkastAmne)}&body=${encodeURIComponent(utkast)}`

  return (
    <div
      id={`kontaktvag-${company.id}`}
      className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-700 space-y-3 text-sm text-stone-700 dark:text-stone-300"
    >
      <p className="text-xs text-stone-600 dark:text-stone-400">
        {t(
          'spontaneous.kontaktvag.intro',
          'Bolagsverket publicerar ingen webbplats, telefon eller e-post. Här är det som finns, med källa.'
        )}
      </p>

      <ul className="space-y-2">
        {adress && (
          <li className="flex flex-wrap items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>
              <span className="font-medium">{t('spontaneous.kontaktvag.postalAddress', 'Postadress')}:</span>{' '}
              {adress.varde}{' '}
              <span className="text-xs text-stone-600 dark:text-stone-400">
                ({t('spontaneous.kontaktvag.sourceBolagsverket', 'källa: Bolagsverket')})
              </span>
            </span>
            <button
              type="button"
              onClick={laggIAnteckningar}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-600 text-xs hover:bg-stone-50 dark:hover:bg-stone-700"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              {t('spontaneous.kontaktvag.addToNotes', 'Lägg i anteckningar')}
            </button>
          </li>
        )}
        {sok && (
          <li className="flex flex-wrap items-center gap-2">
            <Search className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <a href={sok.varde} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
              {t('spontaneous.kontaktvag.searchLink', 'Sök efter företagets egen webbplats')}
              <span className="sr-only"> {t('common.opensInNewTab', '(öppnas i ny flik)')}</span>
            </a>
            <span className="text-xs text-stone-600 dark:text-stone-400">
              {t(
                'spontaneous.kontaktvag.searchHint',
                'Leta efter karriärsida eller kontakt på företagets egen webbplats. Det är en sökning, inte en uppgift vi har kontrollerat.'
              )}
            </span>
          </li>
        )}
      </ul>

      <div className="space-y-1">
        <p className="font-medium">{t('spontaneous.kontaktvag.draftTitle', 'Förslag på kort mejl')}</p>
        <pre className="whitespace-pre-wrap font-sans text-xs bg-stone-50 dark:bg-stone-900 rounded-md p-2 border border-stone-200 dark:border-stone-700">
          {utkast}
        </pre>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {t('spontaneous.kontaktvag.draftNote', 'Fyll i ditt namn och läs igenom innan du skickar. Du skickar själv.')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={kopiera}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-600 text-xs hover:bg-stone-50 dark:hover:bg-stone-700"
          >
            <Copy className="w-3 h-3" aria-hidden="true" />
            {t('spontaneous.kontaktvag.copy', 'Kopiera utkastet')}
          </button>
          <a
            href={mailto}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-600 text-xs hover:bg-stone-50 dark:hover:bg-stone-700"
          >
            <Mail className="w-3 h-3" aria-hidden="true" />
            {t('spontaneous.kontaktvag.openMail', 'Öppna i din e-post')}
          </a>
        </div>
      </div>
    </div>
  )
}
