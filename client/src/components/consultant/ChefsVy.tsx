/**
 * ChefsVy — CH8 (2026-10-12): chefens vy över enheten, på Översikt.
 *
 * Per konsulent: deltagare mot taket och det som kräver chefens uppmärksamhet.
 * Visas bara för org-roll chef/admin; en konsulent eller handläggare ser ingen
 * skillnad och hämtar inte ens caseloaden. Datan är samma vy som tabellen i
 * Inställningar (organization_caseload) och samma beräkning
 * (caseloadKapacitet.chefOversikt → antalMotTaket → kapacitet) — det finns inte
 * två siffror för samma sak.
 *
 * Bara tal, inga deltagaruppgifter. Deltagare utan konsulent går inte att räkna
 * härifrån: vyn är per konsulent och ingen tabell pekar ut otilldelade. Det
 * sägs i klartext i stället för att en nolla visas.
 *
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { orgApi, type CaseloadRow, type OrgKind } from '@/services/orgApi'
import { chefOversikt, KAPACITET_REGEL } from './caseloadKapacitet'
import { cn } from '@/lib/utils'

const arLedning = (role: string) => role === 'chef' || role === 'admin'

function Ram({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="chefsvy-rubrik" data-testid="chefsvy" className="grid gap-4 rounded-j-m bg-j-kort border border-j-linje p-5">
      <h2 id="chefsvy-rubrik" className="font-rubrik text-[1.125rem] font-bold">Enheten</h2>
      {children}
    </section>
  )
}

export function ChefsVy() {
  const medlemskapQ = useQuery({
    queryKey: ['org-medlemskap'],
    queryFn: () => orgApi.myMemberships(),
    staleTime: 5 * 60_000,
  })
  const arChef = medlemskapQ.isSuccess && medlemskapQ.data.some((m) => arLedning(m.role))
  const caseloadQ = useQuery({
    queryKey: ['org-caseload'],
    queryFn: () => orgApi.caseload(),
    enabled: arChef,
    staleTime: 60_000,
  })

  if (!arChef) return null

  if (caseloadQ.isError) {
    return (
      <Ram>
        <p role="alert" className="text-[0.9375rem] text-red-700 dark:text-red-300">
          Enhetens caseload kunde inte hämtas. Försök igen om en stund.
        </p>
      </Ram>
    )
  }
  if (!caseloadQ.data) {
    return (
      <Ram>
        <p role="status" className="text-[0.9375rem] text-j-blak-2">Hämtar enhetens caseload …</p>
      </Ram>
    )
  }

  const kindAv = (orgId: string): OrgKind | null =>
    medlemskapQ.data?.find((m) => m.org_id === orgId)?.organization?.kind ?? null
  const perOrg = new Map<string, { namn: string; rader: CaseloadRow[] }>()
  for (const r of caseloadQ.data) {
    const o = perOrg.get(r.org_id) ?? { namn: r.org_name, rader: [] }
    o.rader.push(r)
    perOrg.set(r.org_id, o)
  }
  const visaTakRegel = [...perOrg.keys()].some((id) => kindAv(id) === 'leverantor')

  return (
    <Ram>
      <p className="-mt-2 text-[0.9375rem] text-j-blak-2">
        Deltagare per konsulent{visaTakRegel ? ' mot taket' : ''} och det som behöver dig.
      </p>
      {caseloadQ.data.length === 0 ? (
        <p className="text-[0.9375rem] text-j-blak-2">Inga konsulenter i organisationen än. Lägg till kollegor under Inställningar.</p>
      ) : (
        [...perOrg.entries()].map(([orgId, o]) => {
          const lista = chefOversikt(o.rader, kindAv(orgId))
          const behover = lista.filter((c) => c.uppmarksamhet.length > 0)
          return (
            <div key={orgId} className="grid gap-3">
              {perOrg.size > 1 && <h3 className="font-semibold">{o.namn}</h3>}
              <div data-testid="chefsvy-uppmarksamhet">
                {behover.length === 0 ? (
                  <p className="text-[0.9375rem] text-j-blak-2">Inget kräver din uppmärksamhet just nu.</p>
                ) : (
                  <ul className="grid gap-1.5">
                    {behover.map((c) => (
                      <li key={c.id} className="text-[0.9375rem]">
                        <span className="font-medium">{c.namn}</span>
                        {': '}
                        {c.uppmarksamhet.map((u, i) => (
                          <span key={u.slag} className={cn(u.slag === 'over' && 'text-red-700 dark:text-red-300 font-medium')}>
                            {i > 0 && '; '}
                            {u.text}
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <ul className="grid gap-1 text-[0.9375rem]" aria-label={`Deltagare per konsulent, ${o.namn}`}>
                {lista.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 border-t border-j-linje pt-1.5 first:border-t-0 first:pt-0">
                    <span>{c.namn}</span>
                    <span className="tabular-nums text-j-blak-2" data-testid="chefsvy-antal">
                      {c.kapacitet.visas ? c.kapacitet.text : `${c.antal} deltagare`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })
      )}
      <p className="text-xs text-j-blak-2">
        Deltagare som saknar konsulent syns inte här: vyn räknar per konsulent. {visaTakRegel && KAPACITET_REGEL}{' '}
        Överlämning och kollegor finns under <Link className="underline" to="/consultant/settings">Inställningar</Link>.
      </p>
    </Ram>
  )
}
