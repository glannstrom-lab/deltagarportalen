/**
 * Kopplingsforfragan — deltagarens svar när en konsulent vill koppla henne
 * (beslut Mikael 2026-10-11). Står överst på Min konsulent, dit notisen
 * "En konsulent vill koppla dig" länkar.
 *
 * Inget delas förrän hon sagt ja. Ett ja kräver båda kryssrutorna — samma
 * samtycke som efterhandsfrågan (KonsulentSamtyckeFraga), med samma
 * i18n-nycklar för vad konsulenten ser. Texten hon läste sparas med samtycket
 * (art. 7.1). Ett nej meddelas inte konsulenten.
 *
 * Tre lägen: laddar / fel / klart. Utan förfrågningar renderas INGENTING.
 * Bakom KOPPLINGSFORFRAGAN_FINNS (PENDING_20261011b) — se kopplingsforfraganApi.ts.
 */

import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { useAuthStore } from '@/stores/authStore'
import {
  KOPPLINGSFORFRAGAN_FINNS,
  kopplingsforfraganApi,
  type Kopplingsforfragan as Forfragan,
} from '@/services/kopplingsforfraganApi'

type Lage =
  | { status: 'laddar' }
  | { status: 'fel' }
  | { status: 'klart'; forfragningar: Forfragan[] }

interface Props {
  className?: string
  /** Flaggan — parametern finns för testerna. */
  aktiv?: boolean
  /** Efter ett ja. Standard: ladda om sidan, så hela appen ser den nya kopplingen. */
  onKopplad?: () => void
}

export function Kopplingsforfragan({ className, aktiv = KOPPLINGSFORFRAGAN_FINNS, onKopplad }: Props) {
  const { t } = useTranslation()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [nekad, setNekad] = useState(false)

  useEffect(() => {
    if (!aktiv) return
    let pagar = true
    kopplingsforfraganApi
      .listaVantande()
      .then((forfragningar) => { if (pagar) setLage({ status: 'klart', forfragningar }) })
      .catch(() => { if (pagar) setLage({ status: 'fel' }) })
    return () => { pagar = false }
  }, [aktiv])

  if (!aktiv) return null
  if (lage.status === 'laddar') return null
  if (lage.status === 'klart' && lage.forfragningar.length === 0) {
    return nekad ? (
      <p role="status" className={`m-0 rounded-j-m bg-j-sankt px-4 py-3 text-[0.9375rem] text-j-blak ${className ?? ''}`}>
        {t('kopplingsforfragan.nekad')}
      </p>
    ) : null
  }

  if (lage.status === 'fel') {
    return (
      <p role="alert" className={`m-0 rounded-j-m border border-j-linje bg-j-kort px-4 py-3 text-[0.9375rem] text-j-blak ${className ?? ''}`}>
        {t('kopplingsforfragan.laddaFel')}
      </p>
    )
  }

  return (
    <div className={`grid gap-4 ${className ?? ''}`}>
      {lage.forfragningar.map((f) => (
        <ForfraganKort
          key={f.id}
          forfragan={f}
          onBesvarad={(svar) => {
            if (svar === 'ACCEPTED') {
              if (onKopplad) onKopplad()
              else window.location.reload()
              return
            }
            setNekad(true)
            setLage((prev) => (prev.status === 'klart'
              ? { status: 'klart', forfragningar: prev.forfragningar.filter((x) => x.id !== f.id) }
              : prev))
          }}
        />
      ))}
    </div>
  )
}

function ForfraganKort({ forfragan: f, onBesvarad }: { forfragan: Forfragan; onBesvarad: (svar: 'ACCEPTED' | 'DECLINED') => void }) {
  const { t } = useTranslation()
  const harKonsulent = !!useAuthStore((s) => s.profile?.consultant_id)
  const [delning, setDelning] = useState(false)
  const [uppsagning, setUppsagning] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const rubrikId = useId()

  const namn = f.konsulent_namn?.trim() || t('kopplingsforfragan.enKonsulent')
  const fran = f.organisation_namn
    ? t('kopplingsforfragan.franOrg', { namn, org: f.organisation_namn })
    : t('kopplingsforfragan.fran', { namn })
  const lista = t('consultantConsent.seesList', { returnObjects: true, namn }) as unknown
  const seesList = Array.isArray(lista) ? (lista as string[]) : []

  // Texten som sparas är den hon läste, ur samma nycklar som renderas nedan.
  const samtyckestext = () =>
    [
      t('kopplingsforfragan.rubrik'),
      fran,
      t('consultantConsent.seesHeading', { namn }),
      ...seesList,
      t('consultantConsent.notSeen'),
      t('consultantConsent.revocation', { namn }),
      ...(harKonsulent ? [t('kopplingsforfragan.byte')] : []),
      t('consultantConsent.checkboxSharing', { namn }),
      t('consultantConsent.checkboxRevocation'),
    ].join('\n')

  const svara = async (ja: boolean) => {
    setSparar(true)
    setFel(null)
    try {
      const svar = await kopplingsforfraganApi.besvara(f.id, ja, ja ? samtyckestext() : undefined)
      onBesvarad(svar)
    } catch {
      setFel(t('kopplingsforfragan.fel'))
      setSparar(false)
    }
  }

  return (
    <section
      aria-labelledby={rubrikId}
      data-testid="kopplingsforfragan"
      className="grid gap-3 rounded-j-m border border-j-linje bg-j-kort p-5 text-j-blak shadow-j sm:p-6"
    >
      <p className="m-0 flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-j-glod">
        <KvarterIkon namn="deltagare" size={18} ton="glod" />
        <span>{t('kopplingsforfragan.etikett')}</span>
      </p>
      <h2 id={rubrikId} className="m-0 font-rubrik text-[1.375rem] font-bold leading-tight">{fran}</h2>
      <p className="m-0 font-semibold">{t('kopplingsforfragan.ingetDelas', { namn })}</p>

      {f.message && (
        <blockquote className="m-0 rounded-j-m bg-j-sankt px-4 py-3 text-[0.9375rem]">
          <span className="block font-semibold">{t('kopplingsforfragan.meddelande', { namn })}</span>
          <span className="whitespace-pre-wrap">{f.message}</span>
        </blockquote>
      )}

      <div>
        <p className="m-0 font-semibold">{t('consultantConsent.seesHeading', { namn })}</p>
        <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-[0.9375rem] text-j-blak-2">
          {seesList.map((rad) => <li key={rad}>{rad}</li>)}
        </ul>
      </div>
      <p className="m-0 text-[0.9375rem] text-j-blak-2">{t('consultantConsent.notSeen')}</p>
      <p className="m-0 text-[0.9375rem] text-j-blak-2">{t('consultantConsent.revocation', { namn })}</p>
      {harKonsulent && (
        <p className="m-0 rounded-j-m bg-j-sankt px-4 py-3 text-[0.9375rem] font-semibold" data-testid="kopplingsforfragan-byte">
          {t('kopplingsforfragan.byte')}
        </p>
      )}

      <label className="flex items-start gap-3 text-[0.9375rem]">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={delning} onChange={(e) => setDelning(e.target.checked)} />
        <span>{t('consultantConsent.checkboxSharing', { namn })}</span>
      </label>
      <label className="flex items-start gap-3 text-[0.9375rem]">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={uppsagning} onChange={(e) => setUppsagning(e.target.checked)} />
        <span>{t('consultantConsent.checkboxRevocation')}</span>
      </label>

      {fel && <p role="alert" className="m-0 font-semibold text-s-ogiltig">{fel}</p>}

      <div className="flex flex-wrap gap-3">
        <Button ton="kvarter" variant="primary" onClick={() => void svara(true)} disabled={sparar || !delning || !uppsagning}>
          {t('kopplingsforfragan.ja')}
        </Button>
        <Button ton="kvarter" variant="secondary" onClick={() => void svara(false)} disabled={sparar}>
          {t('kopplingsforfragan.nej')}
        </Button>
      </div>
    </section>
  )
}
