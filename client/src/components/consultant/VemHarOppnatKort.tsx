/**
 * VemHarOppnatKort — läsloggen deltagaren själv ser (ROADMAP ÖV1, PUB-avvikelse 6).
 *
 * Varje gång konsulenten öppnar deltagarens sida i konsulentvyn skrivs en rad
 * VIEWED_PARTICIPANT_DATA i audit_logs med deltagarens id (laslogg.ts). Den här
 * kortet visar de senaste 20 raderna för den inloggade deltagaren. Tre lägen:
 * laddar / fel / klart — och "klart utan rader" är en invit, inte en nolla.
 * Ingen AI.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { laslogg, type Visning } from '@/services/laslogg'

type Lage =
  | { status: 'laddar' }
  | { status: 'fel' }
  | { status: 'klart'; rader: Visning[] }

export function VemHarOppnatKort() {
  const { t, i18n } = useTranslation()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })

  useEffect(() => {
    let aktiv = true
    laslogg
      .minaVisningar()
      .then((rader) => { if (aktiv) setLage({ status: 'klart', rader }) })
      .catch(() => { if (aktiv) setLage({ status: 'fel' }) })
    return () => { aktiv = false }
  }, [])

  const locale = i18n.language === 'en' ? 'en-GB' : 'sv-SE'
  const datum = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const tid = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  return (
    <Card>
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">
            {t('myConsultant.laslogg.title', 'Vem har öppnat dina uppgifter')}
          </h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          {t('myConsultant.laslogg.desc', 'Varje gång din konsulent öppnar din sida loggas det här. Du ser det, ingen annan behöver berätta det.')}
        </p>
      </div>
      <div className="p-4" aria-live="polite">
        {lage.status === 'laddar' && (
          <p className="text-sm text-stone-500 dark:text-stone-400">…</p>
        )}
        {lage.status === 'fel' && (
          <p className="text-sm text-amber-700 dark:text-amber-300" role="alert">
            {t('myConsultant.laslogg.fel', 'Vi kunde inte hämta loggen just nu.')}
          </p>
        )}
        {lage.status === 'klart' && lage.rader.length === 0 && (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t('myConsultant.laslogg.tomt', 'Ingen har öppnat dina uppgifter än — det syns här när din konsulent gör det.')}
          </p>
        )}
        {lage.status === 'klart' && lage.rader.length > 0 && (
          <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
            {lage.rader.map((r) => (
              <li key={r.id}>
                {t('myConsultant.laslogg.rad', { defaultValue: 'Din konsulent öppnade dina uppgifter {{datum}} kl {{tid}}', datum: datum(r.created_at), tid: tid(r.created_at) })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
