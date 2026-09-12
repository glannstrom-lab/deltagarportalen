/**
 * StodFlik — stöd och regler, för ett företag. Byggd ur data/anstallningsstod.ts
 * genom components/foretag/stodKort.ts, som aldrig släpper igenom belopp,
 * procent eller belopp-liknande tal. Beslut om stöd fattas av
 * Arbetsförmedlingen — det är raden företaget ska ta med sig, inte en siffra.
 */

import { Card } from '@/components/ui/Card'
import { ExternalLink, Landmark } from '@/components/ui/icons'
import { ANSTALLNINGSSTOD } from '@/data/anstallningsstod'
import { byggStodKort } from '@/components/foretag/stodKort'

export function StodFlik() {
  const kort = byggStodKort(ANSTALLNINGSSTOD)
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Stöd och regler</h2>
        <p className="text-sm text-stone-700 dark:text-stone-200 mt-1">
          De vanligaste stöden när ni tar emot eller anställer någon via Arbetsförmedlingen — vad de är och vad som krävs av er.
        </p>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-[var(--c-bg)] p-3 text-sm text-[var(--c-text)]">
        <Landmark className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Beslut om stöd fattas av Arbetsförmedlingen. Er konsulent hjälper er med ansökan.</span>
      </p>

      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {kort.map((s) => (
          <li key={s.id}>
            <Card className="h-full space-y-3">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{s.namn}</h3>
              <p className="text-sm text-stone-800 dark:text-stone-100">{s.kort}</p>
              {s.langd && (
                <p className="text-sm text-stone-700 dark:text-stone-200"><span className="font-medium">Hur länge: </span>{s.langd}</p>
              )}
              {s.kravPaEr.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Vad som krävs av er</p>
                  <ul className="mt-1 list-disc pl-5 space-y-0.5 text-sm text-stone-800 dark:text-stone-100">
                    {s.kravPaEr.map((k, i) => <li key={i}>{k}</li>)}
                  </ul>
                </div>
              )}
              {s.ansokan && (
                <p className="text-sm text-stone-700 dark:text-stone-200"><span className="font-medium">Så ansöker ni: </span>{s.ansokan}</p>
              )}
              <a
                href={s.lank}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--c-text)] underline"
              >
                Läs mer hos Arbetsförmedlingen
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">(öppnas i ny flik)</span>
              </a>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
