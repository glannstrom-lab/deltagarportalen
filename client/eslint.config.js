import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Designsystem-regler från DESIGN.md v3.0 (docs/DESIGN.md).
// Höjda till 'error' 2026-05-14 efter att 309 → 68 gradient-warnings städats
// (78% reduktion). De återstående 68 är whitelistade nedan (CV-mallar,
// RIASEC-färger, Landing-hero, design-tokens, calm-mode CSS).

const DESIGN_RULES = {
  'no-restricted-syntax': [
    'error',
    {
      // 0.1 — Gradient-bakgrunder förbjudna (DESIGN.md §6).
      // Triggas när en sträng innehåller "bg-gradient-to-".
      // Whitelist inline med:  // eslint-disable-next-line no-restricted-syntax
      // (motiverat för dekorativa hjältebilder, ej för knappar/kort/banners)
      selector: "Literal[value=/bg-gradient-to-/]",
      message:
        'Gradient-bakgrund förbjuden (DESIGN.md §6). Använd platt --c-solid för CTA, --c-bg för pastellzoner. Inline-whitelist tillåten endast för dekorativa hero-bilder.',
    },
    {
      // 0.1.b — Samma regel för template literals (cn-anrop, klasstrings)
      selector: "TemplateElement[value.raw=/bg-gradient-to-/]",
      message:
        'Gradient-bakgrund förbjuden (DESIGN.md §6). Använd platt --c-solid för CTA.',
    },
    {
      // 0.2 — Hårdkodade hub-tokens utanför HubOverview (DESIGN.md §14).
      // Komponenter ska konsumera --c-bg / --c-accent / --c-solid / --c-text,
      // aldrig en specifik hubs token (--action-*, --activity-* osv).
      // Undantag: client/src/pages/hubs/HubOverview.tsx hanteras nedan.
      selector:
        "Literal[value=/--(?:action|activity|coaching|info|wellbeing|reflection|outbound)-(?:bg|accent|solid|text)/]",
      message:
        'Hårdkodad hub-token förbjuden (DESIGN.md §14). Använd --c-bg/--c-accent/--c-solid/--c-text. Tokens sätts av PageLayout via data-domain.',
    },
    {
      selector:
        "TemplateElement[value.raw=/--(?:action|activity|coaching|info|wellbeing|reflection|outbound)-(?:bg|accent|solid|text)/]",
      message:
        'Hårdkodad hub-token förbjuden (DESIGN.md §14). Använd --c-bg/--c-accent/--c-solid/--c-text.',
    },
  ],
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      // Underscore-prefix-konvention för avsiktligt unused params/vars.
      // Standard ts-eslint praxis. Tystar t.ex. (_event, value) => ... där
      // event-param krävs av callbacksignatur men vi bara använder value.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // React Compiler-style strict rules: nedgraderade till 'warn' eftersom
      // de flaggar etablerade React-mönster i kodbasen (setState i effekter,
      // Date.now() i render, sub-komponenter under render). Inte rules-of-hooks-
      // brott (de förblir 'error' via reactHooks.configs.flat.recommended).
      // Refaktor av varje fall är icke-trivial och risk för regression.
      // Gradvis migration kan göras genom att höja till 'error' när flaggan adresseras.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      ...DESIGN_RULES,
    },
  },
  {
    // Hub-landningssidor (HubOverview, HubOverviewHistory) är de enda
    // ställena där flera hub-färger samexisterar och behöver direkta
    // token-referenser (DESIGN.md §14).
    files: ['src/pages/hubs/HubOverview*.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Whitelistade filer där gradient är legitim dekoration:
    // - CVTemplates: CV-mall-thumbnails (DESIGN.md §6 — dekorativa)
    // - ResultsView: RIASEC-färger semantiskt distinkta
    // - Landing: dekorativa hero-bakgrunder (Manifestet-godkända)
    // - design-system.ts: designtoken-definitioner, ej UI-output
    // - WellnessQuickCard: dekorativ glow-blur längst ner
    files: [
      'src/components/cv/templates/CVTemplates.tsx',
      'src/components/interest-guide/ResultsView.tsx',
      'src/pages/Landing.tsx',
      'src/styles/design-system.ts',
      'src/components/dashboard/WellnessQuickCard.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // StaParticipant: två-domän-sida (action huvudsakligen + wellbeing för
    // reflektionskort, hälsoaktiviteter). Wellbeing-tokens används medvetet
    // för att skilja "lugnt mående-stöd" från "aktivt jobbsökar-stöd".
    files: ['src/pages/sta/StaParticipant.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
