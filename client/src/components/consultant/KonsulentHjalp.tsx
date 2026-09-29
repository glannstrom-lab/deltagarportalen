/**
 * KonsulentHjalp — Hjälp-sidans innehåll för den som arbetar i konsulentvyn (KH6/KH13,
 * rollspelet 2026-09-28). Sidan var deltagarens (CV, Intresseguiden, jobbsökning) för alla
 * roller; en ny konsulent hittade aldrig hjälp för sitt eget arbete.
 *
 * Konsulentvyn är på svenska med flit (DESIGN.md §2) — texterna står därför här och inte i
 * locale-filerna, som övriga konsulentkomponenter. Varje påstående är läst ur koden; källan
 * står i kommentaren vid posten så nästa läsare kan kontrollera att det fortfarande gäller.
 */

import { Link } from 'react-router-dom'
import { ChevronRight, Mail } from '@/components/ui/icons'
import { KONSULENT_HJALP } from './konsulentHjalpData'

export function KonsulentHjalp() {
  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="konsulent-hjalp">
      {KONSULENT_HJALP.map((kat) => (
        <section
          key={kat.rubrik}
          aria-labelledby={`kh-${kat.rubrik}`}
          className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden"
        >
          <div className="px-6 py-4 bg-[var(--c-bg)] border-b border-[var(--c-accent)]">
            <h2 id={`kh-${kat.rubrik}`} className="font-semibold text-[var(--c-text)]">{kat.rubrik}</h2>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-700">
            {kat.poster.map((p) => (
              <div key={p.fraga} className="p-6">
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">{p.fraga}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{p.svar}</p>
                {p.lank && (
                  <Link to={p.lank.till} className="inline-flex items-center gap-1 text-sm text-[var(--c-text)] hover:text-[var(--c-solid)] font-medium transition-colors">
                    {p.lank.text}
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="bg-[var(--c-bg)] rounded-xl border border-[var(--c-accent)] p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Hittar du inte svaret?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Skriv till oss så hjälper vi dig vidare.</p>
        <a
          href="mailto:support@jobin.se"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-700 text-gray-700 dark:text-gray-200 border border-stone-200 dark:border-stone-600 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
        >
          <Mail className="w-4 h-4" aria-hidden="true" />
          Mejla support
        </a>
      </section>
    </div>
  )
}
