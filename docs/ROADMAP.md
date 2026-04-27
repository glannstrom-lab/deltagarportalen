# Deltagarportalen – Roadmap (12 mån framåt)

**Senast uppdaterad:** 2026-04-27
**Status:** Förslag, ej beslutad. Diskuteras med produktägare och konsulenter innan kommit-tid bokas.

Roadmap-prioritering följer tre principer:

1. **Stabilisera först, expandera sedan.** Dödkod, RLS-luckor och saknade tester är dyrare än ny funktionalitet.
2. **Synergi med EU-utlysningar.** Tre relevanta finns dokumenterade i `docs/26-001…26-010`. Bygg så att portalen kvalificerar.
3. **Konsulenten är hävstången.** Varje ny funktion ska ha ett tydligt konsultvärde – inte bara deltagar­värde – för att skala.

---

## H1 2026 (maj–juli) – STABILISERA

**Tema:** Rensa, mäta, säkra. Inga nya features.

### Maj 2026 – "Operation Spring Clean"
- [ ] **Dödkods-radering** (åtgärd #1 i `portal-review-2026-04.md`). 6 sidfiler bort, ~3500 rader.
- [ ] **Repo-hygien**: arkivera 50+ doc/png/pdf till `archive/2026-q1/`.
- [ ] **README.md uppdatering**: korrekt stack (React 19, OpenRouter), korrekt migrationsguide.
- [ ] **HSTS-header** + `sanitizeInput()`-paritet mellan `/api/ai.js` och edge functions.
- [ ] **Console.log-stripping** i produktionsbygget.
- [ ] **Vite bundle-analys** + ta bort `html2pdf.js` ELLER `html2canvas+jspdf` – välj en PDF-väg.
- [ ] **Migrationskonsolidation**: lös 20260306130000-dubbletten och invitations-trippeln.

**Mätbart resultat:** Bundle <800 KB main chunk, 0 dödkods-imports i `App.tsx`, rotmappen <20 filer.

### Juni 2026 – "Operation Test Cover"
- [ ] **RLS-audit live**: kör `pg_policies`-jämförelse, skriv migration som täpper de 13 tabellerna.
- [ ] **Top-5 testflöden**: login, CV-spara, cover-letter-generering, jobbsök, GDPR-radera. Vitest + Testing Library.
- [ ] **Playwright E2E** för 3 kritiska happy paths (befintlig `e2e/`-mapp aktiveras).
- [ ] **Sentry-konfiguration**: verifiera att fel verkligen rapporteras (logger.ts har TODO).
- [ ] **CI-gate**: PR ska inte kunna mergas om testtäckning sjunker.

**Mätbart resultat:** 100 % RLS-täckning på persondata-tabeller, 30 % testtäckning, Sentry-grupperade fel synliga.

### Juli 2026 – "Konsulent-vyn på riktigt"
- [ ] Fixa `consultantService.ts` TODO:s – riktiga månadsstats (placeringar, slutförda mål).
- [ ] Konsult-dashboard: vilka deltagare behöver kontakt? (sortera på senaste aktivitet, energinivå).
- [ ] Massmeddelande-funktion (med GDPR-loggning).
- [ ] Konsultens egen kalenderintegration (Google Calendar är redan halvbyggt).

**Mätbart resultat:** Konsulent kan se "10 deltagare som inte loggat in på 14 dagar" i en vy.

---

## H2 2026 (aug–okt) – EU-PROJEKT-FASEN

**Tema:** Bygg för att kvalificera till nationella utlysningar.

### Augusti–september – AI-kompetensspår (utlysning 26-002)

Bas-skelettet för "AI-Lärande" som beskrivs i `docs/26-002 - Nationell utlysning POA1`. Implementera Fas 1 av deras 3-fasplan:

- [ ] Ny sida `/ai-larande` med 4 flikar: Guide, Beredskapsindex, Verktyg, Etik.
- [ ] Tabeller: `ai_learning_progress`, `ai_readiness_assessments`, `ai_course_modules`.
- [ ] **AI-Beredskapsindex** (självskattning, 6 kompetensområden, 0–100-poäng).
- [ ] **AI-Kompetensguide** med 5 moduler (Vad är AI?, ML, Generativ AI, AI på arbetsplatsen, Din roll).
- [ ] Konsulent-vy: deltagares AI-poäng + rekommenderade nästa steg.

**Värde:** Underlag för 45 MSEK ESF-ansökan om portalen kvalar in. Även standalone-värde för deltagare.

### Oktober – Mikromeritsystem (utlysning 26-001)

Bas för digitala kompetensbevis:

- [ ] Tabell `micro_credentials` med utfärdare, deltagare, kompetens, verifierings­hash.
- [ ] Generera mikromerit när AI-kurs slutförs, intervjusimulering passerar tröskel, eller CV-poäng >85.
- [ ] PDF-export med QR-kod för verifiering.
- [ ] Deltagaren kan dela mikromeriter på LinkedIn (länka till `LinkedInOptimizer`).

**Värde:** Konkret outcome-mätning för konsulenter och arbetsgivare. Dokumentkrav i fler ESF-utlysningar.

---

## Q4 2026 – KONSOLIDERA OCH MÄTA

### November–december
- [ ] **Performance-budget**: Core Web Vitals i CI. LCP <2.5 s på 3G, INP <200 ms.
- [ ] **A11y-audit** med Lighthouse + manuell skärmläsning på 5 viktigaste sidor.
- [ ] **i18n-täckning**: granska AI-output-strängar (idag inte översatta).
- [ ] **Användarintervjuer** med 5 deltagare + 3 konsulenter. Mät: vilka funktioner används aldrig?
- [ ] **Feature-sunset-process**: dokumentera vilka funktioner som ska tas bort om de inte används av >5 % av aktiva deltagare under Q4.

**Mätbart resultat:** Klart vad som ska in i 2027 och vad som ska bort.

---

## Q1 2027 – framtida arbete (ej spec, bara riktning)

Beroende på vad H2 2026 lär oss:

- **Real-time-meddelanden** mellan deltagare och konsult (idag polling, Supabase Realtime är redan tillgängligt).
- **Ekonomiskt utsatta-spår** (utlysning 26-010 om det vinns).
- **AF-API tier 2-integration**: jobbed, taxonomy, trends finns redan som proxies – exponera dem i UI.
- **PWA-läge** för deltagare med begränsad data: offline CV-redigering, synka när online.
- **AI-Rollsimulator** (modul 7 från 26-002 om grunden funkar).

---

## Vad som EJ ska byggas (förbjudna riktningar)

- **Mobilapp (native)** – PWA räcker. Native = 3x maintenance-kostnad utan motsvarande värde för målgruppen.
- **Egen LLM-hosting** – OpenRouter ger redan modellvalsfrihet. Hosting flyttar oss från produkt-bolag till ML-ops-bolag.
- **Egen videointervju-plattform** – välj integrationspartner (Daily, Whereby) om behovet uppstår.
- **Eget CMS för artiklar** – nuvarande Supabase-tabell + admin-UI räcker. Inga editor-features utan dokumenterat behov.
- **Gamification 2.0** – existerande tabeller (`achievements`, `user_gamification`) räcker. Lägg energi på att använda det som finns.

---

## Beroende mellan spår

```
H1 2026 STABILISERA
  └─ är förutsättning för →
       H2 2026 AI-spår + Mikromeriter
            └─ underlag för →
                  Q1 2027 expansion
```

Att hoppa över H1 = bygga nya features på en kodbas med 19 % testtäckning, dödkod och RLS-luckor. Tekniskt skuldsatt expansion blir dyrare än stabilisering.

---

*Roadmap är ett levande dokument. Uppdateras vid varje kvartal och vid större strategiskifte.*
