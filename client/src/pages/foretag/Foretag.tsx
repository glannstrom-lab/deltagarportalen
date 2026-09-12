/**
 * Foretag — företagskontots vy (AG6, 2026-09-13). Mottagarvy, aldrig
 * kandidatsökning: företaget ser bara de personer som själva godkänt att just
 * de uppgifterna delas med just det företaget (vyn employer_proposals).
 *
 * Företaget är en organisation av slaget `arbetsgivare`, inte en profilroll
 * (useForetagskonto). Vyn är på svenska utan i18n — samma beslut som
 * konsulentvyn (DESIGN.md §2).
 *
 * Tre lägen: laddar (inget påstås), inte företag (lugnt meddelande + länk,
 * ingen redirect, ingen krasch), klart (flikarna). Registreras i App.tsx som
 * `<Route path="foretag/*" element={<Foretag />} />`.
 */

import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { LoadingState } from '@/components/ui/LoadingState'
import { Card } from '@/components/ui/Card'
import { Building2 } from '@/components/ui/icons'
import { useForetagskonto } from '@/hooks/useForetagskonto'
import { FelRuta } from '@/components/foretag/Tillstand'
import { foretagTabs } from './foretagTabs'

const OversiktFlik = lazy(() => import('./OversiktFlik').then((m) => ({ default: m.OversiktFlik })))
const PlatserFlik = lazy(() => import('./PlatserFlik').then((m) => ({ default: m.PlatserFlik })))
const ForslagFlik = lazy(() => import('./ForslagFlik').then((m) => ({ default: m.ForslagFlik })))
const PagaendeFlik = lazy(() => import('./PagaendeFlik').then((m) => ({ default: m.PagaendeFlik })))
const MeddelandenFlik = lazy(() => import('./MeddelandenFlik').then((m) => ({ default: m.MeddelandenFlik })))
const StodFlik = lazy(() => import('./StodFlik').then((m) => ({ default: m.StodFlik })))
const OmFlik = lazy(() => import('./OmFlik').then((m) => ({ default: m.OmFlik })))

export function Foretag() {
  const { org, isLoading, isEmployer, error } = useForetagskonto()

  if (isLoading) {
    return (
      <div className="bg-stone-50 dark:bg-stone-950">
        <PageLayout title="Företagskonto" domain="info" showTabs={false}>
          <LoadingState message="Hämtar ert företagskonto…" />
        </PageLayout>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-stone-50 dark:bg-stone-950">
        <PageLayout title="Företagskonto" domain="info" showTabs={false}>
          <FelRuta fel={error} vad="företagskontot" />
        </PageLayout>
      </div>
    )
  }

  if (!isEmployer || !org) {
    return (
      <div className="bg-stone-50 dark:bg-stone-950">
        <PageLayout title="Företagskonto" domain="info" showTabs={false}>
          <Card className="max-w-xl">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-6 w-6 text-stone-500" aria-hidden="true" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Det här kontot är inte kopplat till något företag
                </h2>
                <p className="text-sm text-stone-700 dark:text-stone-200">
                  Företagskonton skapas genom en inbjudan från en arbetskonsulent eller från en kollega på företaget.
                  Har ni fått en inbjudan är det e-postadressen i mejlet som gäller.
                </p>
                <Link to="/oversikt" className="inline-block text-sm font-medium text-[var(--c-text)] underline">
                  Till din översikt
                </Link>
              </div>
            </div>
          </Card>
        </PageLayout>
      </div>
    )
  }

  return (
    <div className="bg-stone-50 dark:bg-stone-950">
      <PageLayout title={org.name} subtitle="Företagskonto" tabs={foretagTabs} tabVariant="glass" domain="info">
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route index element={<OversiktFlik org={org} />} />
            <Route path="platser" element={<PlatserFlik org={org} />} />
            <Route path="forslag" element={<ForslagFlik org={org} />} />
            <Route path="pagaende" element={<PagaendeFlik org={org} />} />
            <Route path="meddelanden" element={<MeddelandenFlik org={org} />} />
            <Route path="stod" element={<StodFlik />} />
            <Route path="om" element={<OmFlik org={org} />} />
          </Routes>
        </Suspense>
      </PageLayout>
    </div>
  )
}

export default Foretag
