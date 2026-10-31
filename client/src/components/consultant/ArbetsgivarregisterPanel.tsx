/**
 * Arbetsgivarregistret (FN13) — vy-skal i PlatserTab. Visar konsulentens EGNA
 * arbetsgivare (grupperade på org.nr/namn). Kollegornas syns först när
 * `ARBETSGIVARREGISTER_FINNS` är true (kräver migrationen, se arbetsgivarregisterApi.ts).
 * Bara firmauppgifter: aldrig deltagare, kontaktperson, telefon eller e-post.
 * Konsulentvyn översätts inte.
 */

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { byggRegister, type ArbetsgivarPost } from '@/lib/arbetsgivarregister'
import { ARBETSGIVARREGISTER_FINNS, arbetsgivarregisterApi } from '@/services/arbetsgivarregisterApi'
import type { Placering } from '@/services/placeringarApi'

function kortDatumSv(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('sv-SE')
}

interface Props {
  placeringar: readonly Placering[]
  /** Organisationen registret hämtas för (bara när flaggan är på). */
  orgId?: string | null
}

export function ArbetsgivarregisterPanel({ placeringar, orgId }: Props) {
  const [oppen, setOppen] = useState(false)
  const egna = useMemo(() => byggRegister(placeringar), [placeringar])

  const kollegor = useQuery({
    queryKey: ['arbetsgivarregister', orgId],
    queryFn: () => arbetsgivarregisterApi.hamtaForOrganisation(orgId as string),
    enabled: ARBETSGIVARREGISTER_FINNS && oppen && !!orgId,
  })
  const poster: ArbetsgivarPost[] = ARBETSGIVARREGISTER_FINNS && kollegor.data ? kollegor.data : egna

  return (
    <Card variant="flat" padding="md" className="space-y-2">
      <button
        type="button"
        onClick={() => setOppen((v) => !v)}
        aria-expanded={oppen}
        aria-controls="arbetsgivarregister"
        className="text-sm font-medium text-stone-700 underline hover:text-stone-900"
      >
        {oppen ? 'Dölj arbetsgivarregistret' : `Arbetsgivarregistret (${egna.length} egna)`}
      </button>
      {oppen && (
        <div id="arbetsgivarregister" className="space-y-2">
          {!ARBETSGIVARREGISTER_FINNS && (
            <p className="text-xs text-stone-600">
              Det här är dina egna arbetsgivare. Kollegornas syns här när det gemensamma registret är påslaget.
            </p>
          )}
          {ARBETSGIVARREGISTER_FINNS && kollegor.error && (
            <p className="text-xs text-amber-700">
              Kollegornas arbetsgivare kunde inte hämtas ({kollegor.error instanceof Error ? kollegor.error.message : 'okänt fel'}).
            </p>
          )}
          {poster.length === 0 ? (
            <p className="text-sm text-stone-600">Inga arbetsgivare registrerade än.</p>
          ) : (
            <ul className="divide-y divide-stone-100 text-sm">
              {poster.map((p) => (
                <li key={p.nyckel} className="py-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-stone-900">
                    {p.namn}
                    {p.orgnr && <span className="ml-2 font-normal text-stone-500">{p.orgnr}</span>}
                  </span>
                  <span className="text-xs text-stone-600">
                    {p.antalPlatser} {p.antalPlatser === 1 ? 'plats' : 'platser'} · senast ändrad {kortDatumSv(p.senastAndrad)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}
