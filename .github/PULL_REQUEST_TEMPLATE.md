## Vad ändras?

<!-- 1-3 meningar. Vad gör denna PR? Varför? -->

## Hur testat?

<!-- Hur har du verifierat att det fungerar? Skärmdump om UI. -->

- [ ] Lokal dev-server (`cd client && npm run dev`)
- [ ] TypeScript (`npx tsc --noEmit`) — exit 0
- [ ] Tester (`npm run test:run`) — om relevant
- [ ] Playwright (`npx playwright test`) — om E2E-flöde påverkas
- [ ] Manuellt verifierat i browser (golden path + minst 1 edge case)

---

## Designcheck *(om PR rör UI — annars hoppa över)*

Följer ändringen `docs/DESIGN.md` v3.0?

**Ton (DESIGN.md §1-2)**
- [ ] Ingen rubrik är en etikett (alla bjuder in)
- [ ] Ingen knapptext är administrationsspråk ("Aktivera", "Konfigurera")
- [ ] Ingen prestationsmätning ("0 av 5") i hjälte-position
- [ ] Användarens namn används där det går

**Lägen (§3)**
- [ ] Hub-landningssida har full pastell-hero
- [ ] Verktygssida har neutral grå hero med 4 px hub-vänsterkant
- [ ] Inga blandade lägen på samma sida

**Färg (§4 + §6)**
- [ ] En hub-färg på sidan (utom Översikt)
- [ ] Inga gradient-knappar (`bg-gradient-to-*` på `<button>`)
- [ ] 60-30-10-fördelning (60% neutral, 30% pastell, 10% solid)
- [ ] Inga hårdkodade hub-tokens (`--action-solid` etc.) utanför HubOverview

**Densitet (§8)**
- [ ] Max 5-7 saker synliga utan att användaren har valt en avdelning
- [ ] Ett tydligt centrum (en primär CTA)

**Empty state (§7)** — *om sidan kan vara tom*
- [ ] Använder `<EmptyState>`-komponenten
- [ ] Inga "0"-rubriker
- [ ] Inga staplade tomtillstånd
- [ ] Inga oöversatta i18n-keys i UI

**Mobil (§9)** — *om mobil påverkas*
- [ ] `pb-20` eller motsvarande safe-area-marginal
- [ ] Touch-targets ≥ 44×44 px
- [ ] Sub-tabs synliga på mobil (inte gömda i meny)

**Tillgänglighet (§10)**
- [ ] Kontrast ≥ 4.5:1 på all text
- [ ] Fokusring synlig
- [ ] `prefers-reduced-motion` respekteras

---

## Skärmdumpar

<!-- Om UI: före/efter, desktop + mobil -->

| Före | Efter |
|------|-------|
|      |       |

## Övrigt

<!-- Migrations, env-variabler, breaking changes, follow-ups -->
