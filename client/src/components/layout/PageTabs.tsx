/**
 * Typerna för sidans flikar och nyckeltal.
 *
 * Komponenterna `PageTabs` och `PageHeader` som bodde här är arkiverade
 * 2026-09-24 (`archive/2026-09-24-dodkod/client/src/components/layout/PageTabs.tsx`):
 * ingen renderade dem sedan skenan (`SidRail.tsx`) ersatte hjältarna
 * 2026-08-17 — bara barrel-exporten i `layout/index.ts` höll dem vid liv.
 * Typerna används däremot av PageLayout, SidRail, SidRailStats och alla
 * flikdefinitioner, så de ligger kvar under samma sökväg.
 */

import type { ComponentType } from 'react'

export interface Tab {
  id: string
  label: string
  path: string
  icon?: ComponentType<{ className?: string }>
  badge?: number
}

/**
 * Page Stat — ett litet nyckeltal i sidans skena.
 * Valfri `to` gör det till en länk.
 */
export interface PageStat {
  label: string
  value: string | number
  icon?: ComponentType<{ className?: string }>
  to?: string
}
