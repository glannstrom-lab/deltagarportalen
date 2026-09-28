/**
 * Nytt lösenord två gånger + reglerna synliga medan man skriver (PUB-1/BP6, 2026-09-28).
 * Används av sidan "Nytt lösenord" (länken i återställningsmejlet) och av
 * "Byt lösenord" i Inställningar. Reglerna är desamma som vid registreringen och
 * som `strongPasswordSchema` — samma lista som Register.tsx (KO3).
 */
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X } from '@/components/ui/icons'

interface Props {
  nytt: string
  bekrafta: string
  onNytt: (v: string) => void
  onBekrafta: (v: string) => void
}

export function NyttLosenordFalt({ nytt, bekrafta, onNytt, onBekrafta }: Props) {
  const { t } = useTranslation()
  const id = useId()
  const regler = useMemo(() => [
    { id: 'length', label: t('auth.passwordRules.minLength'), ok: nytt.length >= 12 },
    { id: 'uppercase', label: t('auth.passwordRules.uppercase'), ok: /[A-Z]/.test(nytt) },
    { id: 'lowercase', label: t('auth.passwordRules.lowercase'), ok: /[a-z]/.test(nytt) },
    { id: 'number', label: t('auth.passwordRules.number'), ok: /[0-9]/.test(nytt) },
    { id: 'special', label: t('auth.passwordRules.special'), ok: /[^A-Za-z0-9]/.test(nytt) },
    { id: 'noRepeat', label: t('auth.passwordRules.noRepeat'), ok: nytt.length > 0 && !/(.)\1{2,}/.test(nytt) },
    {
      id: 'noWeakPattern',
      label: t('auth.passwordRules.noWeakPattern'),
      ok: nytt.length > 0 && !['password', 'lösenord', '12345678', 'qwerty', 'abc123'].some((w) => nytt.toLowerCase().includes(w)),
    },
  ], [t, nytt])
  const falt = 'w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]'
  const olika = bekrafta.length > 0 && bekrafta !== nytt

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${id}-nytt`} className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-1">
          {t('aterstall.nyttLosenord')}
        </label>
        <input id={`${id}-nytt`} type="password" autoComplete="new-password" value={nytt} onChange={(e) => onNytt(e.target.value)} className={falt} aria-describedby={`${id}-regler`} />
        <ul id={`${id}-regler`} className="mt-2 space-y-1 text-sm" aria-label={t('aterstall.reglerRubrik')}>
          {regler.map((r) => (
            <li key={r.id} className={r.ok ? 'text-emerald-700 dark:text-emerald-400 flex gap-2 items-center' : 'text-stone-600 dark:text-stone-300 flex gap-2 items-center'}>
              {r.ok ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
              <span>{r.label}</span>
              <span className="sr-only">{r.ok ? t('aterstall.uppfyllt') : t('aterstall.ejUppfyllt')}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <label htmlFor={`${id}-bekrafta`} className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-1">
          {t('aterstall.bekrafta')}
        </label>
        <input id={`${id}-bekrafta`} type="password" autoComplete="new-password" value={bekrafta} onChange={(e) => onBekrafta(e.target.value)} className={falt} aria-invalid={olika} aria-describedby={olika ? `${id}-olika` : undefined} />
        {olika && <p id={`${id}-olika`} className="mt-1 text-sm text-red-700 dark:text-red-300" role="alert">{t('aterstall.olika')}</p>}
      </div>
    </div>
  )
}
