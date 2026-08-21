/**
 * Flikarna på /career. Fem stycken.
 *
 * Nätverk flyttade till /nätverk. Företag togs bort (dubblerade
 * Spontanansökan). Kompetens slogs ihop med /skills-gap-analysis.
 *
 * Granskning 2026-08-21 — två saker togs bort här:
 *
 * · **`badgeKey: 'career.new'`** låg på Anpassning, Meriter och Flytta.
 *   Märkningen hade ingen utgångsmekanism: den var en statisk sträng utan
 *   datum och utan koppling till `jobin_visited_features` (som sidnavens
 *   badge i `navigation.ts` faktiskt använder). "Ny!" hade alltså stått kvar
 *   för alltid. Den *syntes* aldrig — `SidRail` renderar inte `badge` alls,
 *   och den gamla `PageTabs`-vägen vaktade varje badge med `badge > 0`, vilket
 *   är falskt för strängen "Ny!". Enda spåret den lämnade var ett typfel i den
 *   frysta takskulden. Vill man märka en flik igen: använd skenans
 *   `markering`-prop och grinda den mot ett datum eller mot besökshistoriken.
 *
 * · **Den andra listan, `careerTabs`** (hårdkodad svenska, "for backwards
 *   compatibility"). Den hade tre anropare, alla i `getTabsForPath` — och alla
 *   tre var onåbara: `/career` skickar alltid `customTabs`, `/skills-gap` kör
 *   `showTabs={false}`, och `/career-plan` är ingen route. Listorna hade redan
 *   glidit isär (badges skilde sig). En sanning räcker.
 */

import {
  TrendingUp,
  Accessibility,
  Target,
  GraduationCap,
  Home,
} from '@/components/ui/icons'

// Etiketterna slås upp vid rendering — se Career.tsx.
export const careerTabDefs = [
  { id: 'labor-market', labelKey: 'career.tabs.laborMarket', path: '/career', icon: TrendingUp },
  { id: 'adaptation', labelKey: 'career.tabs.adaptation', path: '/career/adaptation', icon: Accessibility },
  { id: 'credentials', labelKey: 'career.tabs.credentials', path: '/career/credentials', icon: GraduationCap },
  { id: 'relocation', labelKey: 'career.tabs.relocation', path: '/career/relocation', icon: Home },
  { id: 'plan', labelKey: 'career.tabs.plan', path: '/career/plan', icon: Target },
]
