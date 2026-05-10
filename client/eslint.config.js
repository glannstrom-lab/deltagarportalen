import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Designsystem-regler från DESIGN.md v3.0 (docs/DESIGN.md). Dessa hålls som
// 'warn' tills Fas 4 i DESIGN-ROADMAP.md har städat befintliga överträdelser
// (~165 gradient-uses + okänt antal hårdkodade hub-tokens). Sen byts till
// 'error' i samma fas. Befintliga skulder dokumenteras i docs/DESIGN-DEBT.md.

const DESIGN_RULES = {
  'no-restricted-syntax': [
    'warn',
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
])
