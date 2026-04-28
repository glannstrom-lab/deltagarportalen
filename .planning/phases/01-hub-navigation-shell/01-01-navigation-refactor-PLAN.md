---
phase: 01-hub-navigation-shell
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - client/src/components/layout/navigation.ts
  - client/src/i18n/locales/sv.json
autonomous: true
requirements:
  - NAV-01
  - NAV-02
  - NAV-05

must_haves:
  truths:
    - "navHubs export exists with exactly 5 entries: oversikt, jobb, karriar, resurser, min-vardag"
    - "pageToHub lookup map exists and resolves every existing deep-link path to its owning HubId"
    - "isHubNavEnabled() reads import.meta.env.VITE_HUB_NAV_ENABLED once and returns boolean"
    - "navItems flat export still derives from existing nav data so MobileMainMenu (which imports navItems indirectly via navGroups) keeps working"
    - "Existing navGroups export remains unchanged so old sidebar/mobile menu still compile when flag is off"
  artifacts:
    - path: "client/src/components/layout/navigation.ts"
      provides: "NavHub type, HubId type, navHubs constant, pageToHub map, getActiveHub helper, isHubNavEnabled flag reader"
      contains:
        - "export const navHubs"
        - "export const pageToHub"
        - "export function getActiveHub"
        - "export function isHubNavEnabled"
        - "export type HubId"
    - path: "client/src/i18n/locales/sv.json"
      provides: "Swedish labels for the 5 hubs under nav.hubs.*"
      contains:
        - "\"hubs\":"
        - "\"oversikt\""
  key_links:
    - from: "navHubs[].memberPaths"
      to: "pageToHub map"
      via: "build-time derivation in same file"
      pattern: "pageToHub\\[.*\\] = "
    - from: "isHubNavEnabled()"
      to: "import.meta.env.VITE_HUB_NAV_ENABLED"
      via: "Vite env access read once at module load"
      pattern: "import\\.meta\\.env\\.VITE_HUB_NAV_ENABLED"
---

<objective>
Refactor `client/src/components/layout/navigation.ts` to introduce a hub-oriented navigation model alongside the existing 3-group `navGroups` export, plus the rollout flag reader. Both navigations must coexist — the old `navGroups` keeps its full shape so existing Sidebar.tsx and MobileMainMenu compile unchanged when the flag is off. New consumers (Sidebar refactor in Plan 03, HubBottomNav in Plan 04) read `navHubs`, `pageToHub`, `getActiveHub`, and `isHubNavEnabled`.

Purpose: Establishes the navigation source-of-truth for every Wave 2/3 plan. Without this, no other Phase 1 work can proceed. Active-hub resolution must use the explicit `pageToHub` map per PITFALLS.md Pitfall 2 — not URL prefix matching.

Output: Updated `navigation.ts` exporting `NavHub`, `HubId`, `navHubs`, `pageToHub`, `getActiveHub(pathname)`, `isHubNavEnabled()`. Updated `sv.json` with `nav.hubs` translation keys.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/ARCHITECTURE.md
@.planning/research/PITFALLS.md

<interfaces>
<!-- Current navigation.ts shape (read in detail before modifying). -->
<!-- Executor must NOT delete navGroups, navItems, adminNavItems, consultantNavItems, NEWEST_FEATURE,
     getVisitedFeatures, markFeatureVisited, or shouldShowBadge — those are still used by
     Sidebar.tsx (current), Layout.tsx -> MobileMainMenu, and several other consumers. -->

From client/src/components/layout/navigation.ts (existing):
```typescript
export interface NavItem {
  path: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  isNew?: boolean
}

export type NavDomain = 'action' | 'reflection' | 'outbound'

export interface NavGroup {
  id: string
  labelKey: string
  domain: NavDomain
  fallbackLabel: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [/* 3 groups: action, reflection, outbound */]
export const navItems = navGroups.flatMap(group => group.items)
export const adminNavItems = [...]
export const consultantNavItems = [...]
export const NEWEST_FEATURE = '/ai-team'
export function getVisitedFeatures(): string[]
export function markFeatureVisited(path: string): void
export function shouldShowBadge(item: NavItem): boolean
```

The 27 deep-link paths currently in navGroups (group these into hubs in this plan):
- /, /profile, /my-consultant, /ai-team, /nätverk, /knowledge-base, /resources
- /cv, /cover-letter, /wellness, /diary, /career, /interest-guide, /skills-gap-analysis, /personal-brand, /education, /interview-simulator, /calendar, /exercises
- /job-search, /applications, /spontanansökan, /linkedin-optimizer, /salary, /international, /print-resources, /externa-resurser

From .planning/research/ARCHITECTURE.md "Five hubs mapping existing 27 items":
| Hub | id | path | domain | memberPaths |
|-----|-----|------|--------|-------------|
| Översikt | oversikt | /oversikt | action | (meta-hub — NO leaf pages) |
| Söka jobb | jobb | /jobb | activity | /job-search, /applications, /spontanansökan, /cv, /cover-letter, /interview-simulator, /salary, /international, /linkedin-optimizer |
| Karriär | karriar | /karriar | coaching | /career, /interest-guide, /skills-gap-analysis, /personal-brand, /education |
| Resurser | resurser | /resurser | info | /knowledge-base, /resources, /print-resources, /externa-resurser, /ai-team, /help, /nätverk |
| Min vardag | min-vardag | /min-vardag | wellbeing | /wellness, /diary, /calendar, /exercises, /my-consultant, /profile |

Note: `/` (Dashboard) is owned by NO hub directly — when the flag is on, `/` redirects to `/oversikt` (handled in Plan 02). `pageToHub['/']` should still return `'oversikt'` so navigation logic during the brief redirect window doesn't crash.

NavDomain type currently has only `'action' | 'reflection' | 'outbound'` (legacy 3-domain system). The hub domain values from ARCHITECTURE.md (`'action' | 'activity' | 'coaching' | 'info' | 'wellbeing'`) are the 5-domain DESIGN.md system. Use `LegacyColorDomain` from `@/lib/domains` (already imported by PageLayout.tsx) — it accepts both new and legacy domain values. Verify the type accepts all 5 hub domains by reading `client/src/lib/domains.ts` first.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add NavHub model, navHubs constant, pageToHub map, and helper functions to navigation.ts</name>

  <read_first>
    - client/src/components/layout/navigation.ts (full file — must understand existing exports before adding new ones)
    - client/src/lib/domains.ts (verify LegacyColorDomain accepts 'action' | 'activity' | 'coaching' | 'info' | 'wellbeing')
    - .planning/research/ARCHITECTURE.md section "Five hubs mapping existing 27 items" (canonical hub-to-path mapping)
    - .planning/research/PITFALLS.md Pitfall 2 (active-state via pageToHub map, not URL prefix)
  </read_first>

  <files>
    - client/src/components/layout/navigation.ts (modify — append new exports, do NOT delete existing)
    - client/src/components/layout/navigation.test.ts (create — new test file)
  </files>

  <behavior>
    - Test 1: navHubs has exactly 5 entries with ids ['oversikt', 'jobb', 'karriar', 'resurser', 'min-vardag'] in that order
    - Test 2: navHubs[].path values are exactly ['/oversikt', '/jobb', '/karriar', '/resurser', '/min-vardag']
    - Test 3: navHubs[].domain values are exactly ['action', 'activity', 'coaching', 'info', 'wellbeing']
    - Test 4: pageToHub['/cv'] === 'jobb' (proves Söka jobb owns CV)
    - Test 5: pageToHub['/career'] === 'karriar' (proves Karriär owns career page)
    - Test 6: pageToHub['/wellness'] === 'min-vardag'
    - Test 7: pageToHub['/knowledge-base'] === 'resurser'
    - Test 8: pageToHub['/'] === 'oversikt' (root maps to overview hub)
    - Test 9: getActiveHub('/applications') returns the navHubs entry with id 'jobb'
    - Test 10: getActiveHub('/cv/builder') returns the navHubs entry with id 'jobb' (sub-paths under hub members resolve to the same hub)
    - Test 11: getActiveHub('/oversikt') returns the navHubs entry with id 'oversikt' (hub path itself)
    - Test 12: getActiveHub('/some-unknown-path') returns undefined (does not throw, does not default-match)
    - Test 13: Every path that appears in any hub's memberPaths array also appears as a key in pageToHub map (parity check via iteration)
    - Test 14: navGroups export still exists and has length 3 (legacy navigation untouched)
    - Test 15: navItems export still exists and contains '/cv' and '/job-search' (legacy flat list untouched)
  </behavior>

  <action>
    APPEND (do NOT replace) to client/src/components/layout/navigation.ts the following new exports. Keep the entire existing file (navGroups, navItems, adminNavItems, consultantNavItems, NEWEST_FEATURE, getVisitedFeatures, markFeatureVisited, shouldShowBadge) UNCHANGED.

    Add these new exports BELOW the existing exports:

    ```typescript
    // ============================================
    // HUB NAVIGATION (v1.0 milestone — Phase 1)
    // 5 domain-oriented hubs replacing the flat 27-item nav
    // Coexists with navGroups via VITE_HUB_NAV_ENABLED
    // ============================================

    import type { LegacyColorDomain } from '@/lib/domains'

    export type HubId = 'oversikt' | 'jobb' | 'karriar' | 'resurser' | 'min-vardag'

    export interface NavHub {
      id: HubId
      path: string
      labelKey: string
      fallbackLabel: string
      /** Design domain — drives --c-* tokens in sidebar, bottom nav, and on hub page */
      domain: LegacyColorDomain
      icon: React.ComponentType<{ className?: string }>
      /** Pages reachable via this hub. Used by pageToHub map and active-hub detection.
       *  NEVER add a path here that also appears in another hub. */
      memberPaths: string[]
      /** Deep-link sub-items shown beneath the hub when expanded in sidebar */
      items: NavItem[]
    }

    export const navHubs: NavHub[] = [
      {
        id: 'oversikt',
        path: '/oversikt',
        labelKey: 'nav.hubs.oversikt',
        fallbackLabel: 'Översikt',
        domain: 'action',
        icon: LayoutDashboard,
        // Översikt is a meta-hub — it owns no leaf pages, only the hub page itself.
        // '/' is included so legacy bookmarks resolve cleanly until the redirect runs.
        memberPaths: ['/'],
        items: [],
      },
      {
        id: 'jobb',
        path: '/jobb',
        labelKey: 'nav.hubs.jobb',
        fallbackLabel: 'Söka jobb',
        domain: 'activity',
        icon: Briefcase,
        memberPaths: [
          '/job-search',
          '/applications',
          '/spontanansökan',
          '/cv',
          '/cover-letter',
          '/interview-simulator',
          '/salary',
          '/international',
          '/linkedin-optimizer',
        ],
        items: [
          { path: '/job-search', labelKey: 'nav.jobSearch', icon: Search },
          { path: '/applications', labelKey: 'nav.applications', icon: ClipboardList },
          { path: '/spontanansökan', labelKey: 'nav.spontaneous', icon: Building2 },
          { path: '/cv', labelKey: 'nav.cv', icon: FileUser },
          { path: '/cover-letter', labelKey: 'nav.coverLetter', icon: Mail },
          { path: '/interview-simulator', labelKey: 'nav.interviewSimulator', icon: Mic },
          { path: '/salary', labelKey: 'nav.salary', icon: Wallet },
          { path: '/international', labelKey: 'nav.international', icon: Globe },
          { path: '/linkedin-optimizer', labelKey: 'nav.linkedinOptimizer', icon: Linkedin },
        ],
      },
      {
        id: 'karriar',
        path: '/karriar',
        labelKey: 'nav.hubs.karriar',
        fallbackLabel: 'Karriär',
        domain: 'coaching',
        icon: Target,
        memberPaths: [
          '/career',
          '/interest-guide',
          '/skills-gap-analysis',
          '/personal-brand',
          '/education',
        ],
        items: [
          { path: '/career', labelKey: 'nav.career', icon: Target },
          { path: '/interest-guide', labelKey: 'nav.interestGuide', icon: Compass },
          { path: '/skills-gap-analysis', labelKey: 'nav.skillsGap', icon: TrendingUp },
          { path: '/personal-brand', labelKey: 'nav.personalBrand', icon: Star },
          { path: '/education', labelKey: 'nav.education', icon: GraduationCap },
        ],
      },
      {
        id: 'resurser',
        path: '/resurser',
        labelKey: 'nav.hubs.resurser',
        fallbackLabel: 'Resurser',
        domain: 'info',
        icon: BookOpen,
        memberPaths: [
          '/knowledge-base',
          '/resources',
          '/print-resources',
          '/externa-resurser',
          '/ai-team',
          '/help',
          '/nätverk',
        ],
        items: [
          { path: '/knowledge-base', labelKey: 'nav.knowledgeBase', icon: BookOpen },
          { path: '/resources', labelKey: 'nav.myDocuments', icon: Bookmark },
          { path: '/print-resources', labelKey: 'nav.printResources', icon: Printer },
          { path: '/externa-resurser', labelKey: 'nav.externalResources', icon: ExternalLink },
          { path: '/ai-team', labelKey: 'nav.aiTeam', icon: Bot, isNew: true },
          { path: '/nätverk', labelKey: 'nav.network', icon: Users },
        ],
      },
      {
        id: 'min-vardag',
        path: '/min-vardag',
        labelKey: 'nav.hubs.min-vardag',
        fallbackLabel: 'Min vardag',
        domain: 'wellbeing',
        icon: Heart,
        memberPaths: [
          '/wellness',
          '/diary',
          '/calendar',
          '/exercises',
          '/my-consultant',
          '/profile',
        ],
        items: [
          { path: '/wellness', labelKey: 'nav.wellness', icon: Smile },
          { path: '/diary', labelKey: 'nav.diary', icon: NotebookPen },
          { path: '/calendar', labelKey: 'nav.calendar', icon: Calendar },
          { path: '/exercises', labelKey: 'nav.exercises', icon: Dumbbell },
          { path: '/my-consultant', labelKey: 'nav.myConsultant', icon: UserCheck },
          { path: '/profile', labelKey: 'nav.profile', icon: Users },
        ],
      },
    ]

    /**
     * Lookup map: deep-link path -> owning hub id.
     * Built at module load by iterating navHubs[].memberPaths.
     * NEVER use URL prefix matching for active-hub detection (PITFALLS.md Pitfall 2).
     */
    export const pageToHub: Record<string, HubId> = (() => {
      const map: Record<string, HubId> = {}
      for (const hub of navHubs) {
        for (const path of hub.memberPaths) {
          map[path] = hub.id
        }
        // Also map the hub's own path (e.g. '/jobb' -> 'jobb')
        map[hub.path] = hub.id
      }
      return map
    })()

    /**
     * Resolve which hub owns a given pathname.
     * Strategy: explicit map lookup, with fallback for sub-paths under a member path
     * (e.g. '/cv/builder' resolves to 'jobb' because '/cv' is a member of 'jobb').
     * Returns undefined for unknown paths (e.g. '/login', '/admin', '/settings').
     */
    export function getActiveHub(pathname: string): NavHub | undefined {
      // Exact match first
      const directHubId = pageToHub[pathname]
      if (directHubId) {
        return navHubs.find(h => h.id === directHubId)
      }
      // Sub-path match: find a member path that the pathname starts with + '/'
      for (const hub of navHubs) {
        for (const memberPath of hub.memberPaths) {
          if (pathname === memberPath || pathname.startsWith(memberPath + '/')) {
            return hub
          }
        }
      }
      return undefined
    }

    /**
     * Read VITE_HUB_NAV_ENABLED once at module load.
     * Default: false (old navigation stays active until env var is explicitly set to 'true').
     * Per STATE.md decision: rollout via env flag only, no per-user DB flag (PITFALLS.md Pitfall 16).
     */
    const HUB_NAV_FLAG = import.meta.env.VITE_HUB_NAV_ENABLED === 'true'

    export function isHubNavEnabled(): boolean {
      return HUB_NAV_FLAG
    }
    ```

    Then create client/src/components/layout/navigation.test.ts with all 15 tests from the behavior block. Use Vitest. Import navHubs, pageToHub, getActiveHub, navGroups, navItems from './navigation'. Do NOT import isHubNavEnabled in the test (env var is module-load-time and brittle to test).

    Key implementation rules:
    - Reuse the existing `import` statement at the top of navigation.ts for icons (LayoutDashboard, Briefcase, Target, BookOpen, Heart, Search, ClipboardList, Building2, FileUser, Mail, Mic, Wallet, Globe, Linkedin, Compass, TrendingUp, Star, GraduationCap, Bookmark, Printer, ExternalLink, Bot, Users, Smile, NotebookPen, Calendar, Dumbbell, UserCheck). All these are already imported.
    - The labelKey 'nav.hubs.min-vardag' contains a hyphen — i18next supports this in nested keys via the standard JSON path; the next task creates the translation entries.
    - Do NOT touch navGroups, navItems, adminNavItems, consultantNavItems, NEWEST_FEATURE, or any of the visited-features functions.
  </action>

  <verify>
    <automated>cd client && npm run test:run -- src/components/layout/navigation.test.ts</automated>
  </verify>

  <acceptance_criteria>
    - File client/src/components/layout/navigation.ts contains the literal string 'export const navHubs'
    - File client/src/components/layout/navigation.ts contains the literal string 'export const pageToHub'
    - File client/src/components/layout/navigation.ts contains the literal string 'export function getActiveHub'
    - File client/src/components/layout/navigation.ts contains the literal string 'export function isHubNavEnabled'
    - File client/src/components/layout/navigation.ts contains the literal string 'export type HubId'
    - File client/src/components/layout/navigation.ts still contains the literal string 'export const navGroups' (unchanged legacy export)
    - File client/src/components/layout/navigation.ts still contains the literal string 'export const navItems'
    - File client/src/components/layout/navigation.ts contains the literal string 'import.meta.env.VITE_HUB_NAV_ENABLED'
    - File client/src/components/layout/navigation.test.ts exists with at least 15 it() blocks
    - Command `cd client && npm run test:run -- src/components/layout/navigation.test.ts` exits 0
    - Command `cd client && npx tsc --noEmit` exits 0 (no new type errors introduced)
    - grep 'memberPaths' client/src/components/layout/navigation.ts returns 5 hub-block matches
  </acceptance_criteria>

  <done>
    - navHubs array exports with exactly 5 hubs in order: oversikt, jobb, karriar, resurser, min-vardag
    - pageToHub maps every deep-link path to its owning hub id
    - getActiveHub() resolves both exact paths and sub-paths under hub members
    - isHubNavEnabled() reads import.meta.env.VITE_HUB_NAV_ENABLED at module load
    - All 15 unit tests pass
    - Legacy navGroups, navItems, adminNavItems, consultantNavItems untouched and still typecheck
  </done>
</task>

<task type="auto">
  <name>Task 2: Add nav.hubs translation keys to sv.json</name>

  <read_first>
    - client/src/i18n/locales/sv.json (read existing nav.* block at lines 175-219 to match style)
    - client/src/components/layout/navigation.ts (verify the labelKey strings used in navHubs)
  </read_first>

  <files>
    - client/src/i18n/locales/sv.json (modify — add hubs sub-block under "nav")
  </files>

  <action>
    Open client/src/i18n/locales/sv.json. Locate the existing "nav" object at line 175 (it currently contains "dashboard", "profile", ..., "groups"). Add a NEW sibling key "hubs" inside "nav" at the same level as "groups", with the following exact structure:

    ```json
    "hubs": {
      "oversikt": "Översikt",
      "jobb": "Söka jobb",
      "karriar": "Karriär",
      "resurser": "Resurser",
      "min-vardag": "Min vardag"
    }
    ```

    Place "hubs" BEFORE the existing "groups" key inside "nav" so the diff is minimal. Preserve all existing nav.* keys exactly. Maintain valid JSON (commas correct).

    Do NOT add hub keys to en.json — Swedish is the primary language per PROJECT.md, and English translation is not a launch requirement. Other plans may add en.json later if needed.
  </action>

  <verify>
    <automated>cd client && node -e "const sv = require('./src/i18n/locales/sv.json'); if (!sv.nav.hubs.oversikt || !sv.nav.hubs.jobb || !sv.nav.hubs.karriar || !sv.nav.hubs.resurser || !sv.nav.hubs['min-vardag']) { console.error('Missing hub keys'); process.exit(1); } console.log('OK');"</automated>
  </verify>

  <acceptance_criteria>
    - File client/src/i18n/locales/sv.json contains the literal string '"hubs":'
    - File client/src/i18n/locales/sv.json parses as valid JSON (no parse errors)
    - sv.nav.hubs.oversikt === "Översikt"
    - sv.nav.hubs.jobb === "Söka jobb"
    - sv.nav.hubs.karriar === "Karriär"
    - sv.nav.hubs.resurser === "Resurser"
    - sv.nav.hubs["min-vardag"] === "Min vardag"
    - All other existing nav.* keys (dashboard, profile, cv, ...) still resolve unchanged
  </acceptance_criteria>

  <done>
    - sv.json has a new nav.hubs block with all 5 hub labels in Swedish
    - JSON parses successfully
    - Verification command exits 0
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `cd client && npm run test:run -- src/components/layout/navigation.test.ts` exits 0
2. `cd client && npx tsc --noEmit` exits 0
3. `grep -c 'export' client/src/components/layout/navigation.ts` returns at least 12 (legacy + new exports)
4. `node -e "console.log(JSON.parse(require('fs').readFileSync('client/src/i18n/locales/sv.json','utf8')).nav.hubs.jobb)"` prints "Söka jobb"

If any check fails, fix before claiming the plan complete.
</verification>

<success_criteria>
- navHubs, pageToHub, getActiveHub, isHubNavEnabled, HubId all export from navigation.ts
- 15 unit tests pass and lock the structure for downstream plans
- Legacy navGroups/navItems/adminNavItems/consultantNavItems remain functional
- Translation keys exist for all 5 hubs in sv.json
- VITE_HUB_NAV_ENABLED is read once at module load via import.meta.env
- No TypeScript errors introduced
</success_criteria>

<output>
After completion, create `.planning/phases/01-hub-navigation-shell/01-01-SUMMARY.md` documenting:
- The exact set of new exports added to navigation.ts
- The 27 deep-link paths and which hub each is mapped to (table form)
- Any deviations from the action block (with rationale)
- Confirmation that 15 tests pass
- Confirmation that legacy exports are unchanged
</output>
