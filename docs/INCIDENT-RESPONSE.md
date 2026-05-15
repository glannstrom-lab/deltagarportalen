# Säkerhetsincident — Response Plan

**Lagkrav:** GDPR Art 33 (anmälan inom 72h till IMY) + Art 34 (informera registrerade vid hög risk).
**Datum:** 2026-05-15

## När gäller anmälan?

Personuppgiftsincident = "säkerhetsbrott som leder till oavsiktlig eller olaglig förstöring, förlust, ändring, obehörigt röjande eller obehörig åtkomst till personuppgifter" (GDPR Art 4.12).

Exempel på vad som triggrar:
- Obehörig åtkomst till databasen (bruten RLS, läckt service-role-key)
- Tappad backup-fil
- Phishing-attack mot konsulent som lett till åtkomst
- Ransomware som krypterar persondata
- Felaktig publicering (CV/dagbok blir publik av misstag)
- Vendor-breach (Supabase, Vercel, OpenRouter, Sentry)

## Akut respons — 0-4 timmar

### Steg 1: Bekräfta och innesluta
1. **Aktivera IR-team** — utvecklare + DPO + ev. extern säkerhetskonsult
2. **Stoppa pågående exponering** — rotera nycklar, blockera IP, ta ner berörd endpoint
3. **Bevara bevis** — ladda ner loggar, screenshotta, dokumentera tidslinje

### Steg 2: Bedöm omfattning
| Fråga | Svar |
|---|---|
| Vilka tabeller/data berörda? | _ |
| Hur många registrerade? | _ |
| Vilka kategorier persondata? | _ |
| Innehåller det Art 9 (hälsodata)? | _ |
| Tidsfönster för exponering? | _ |
| Var stulen data exfiltrerad? | _ |

### Steg 3: Klassificera risk
- **Låg risk:** Inga åtgärder krävs mot registrerade. Anmäl ändå till IMY.
- **Hög risk:** Måste informera berörda registrerade utan oskäligt dröjsmål (Art 34).
- **Mycket hög risk** (massiv läcka av Art 9-data): Pressmeddelande + IMY akut + ev. polisanmälan.

## 4-72 timmar — formell hantering

### Anmälan till IMY (Art 33)

Görs via: <https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/anmal-personuppgiftsincident/>

**Innehåll:**
1. Beskrivning av incidenten
2. Kategorier och ungefärligt antal registrerade
3. Kategorier och antal poster
4. Sannolika konsekvenser
5. Vidtagna och planerade åtgärder
6. Kontaktuppgifter (DPO eller motsvarande)

**Tidsfrist:** 72 timmar från upptäckt. Om delar av informationen saknas, anmäl ändå inom 72h och komplettera senare.

### Information till registrerade (Art 34) — om hög risk
Email + i-app-meddelande till alla berörda inom så snabbt som möjligt:
- Vad har hänt (klart språk)
- Vilka data som berörts
- Vilka konsekvenser kan uppstå
- Vad vi gör för att åtgärda
- Vad användaren själv kan göra (byt lösenord, var observant på phishing)
- Kontakt: dpo@jobin.se

## Eskaleringsmatris

| Allvarlighetsgrad | Trigger | Åtgärd | Tidsfrist |
|---|---|---|---|
| **P0 — Kritisk** | Massiv läcka av Art 9-data | DPO + ledning + extern jurist + IMY akutkanal + ev. polis | <4h |
| **P1 — Hög** | Bekräftad obehörig åtkomst, antal registrerade > 100 | DPO + IR-team + IMY-anmälan + Art 34-information | <24h |
| **P2 — Medel** | Misstänkt incident, omfattning oklar | DPO + IR-team + IMY-anmälan (preliminär) | <72h |
| **P3 — Låg** | Mindre fel, ingen exponering | Logga, dokumentera, ev. IMY-anmälan om GDPR-relevant | <7 dygn |

## Vendor-incidenter

Om en personuppgiftsbiträde meddelar en incident hos dem:
- Notera datum/tid för deras notifikation
- Vår 72h-klocka börjar då
- Be biträdet om all info de har
- Genomför egen bedömning av påverkan på våra registrerade
- Anmäl själv till IMY även om biträdet redan anmält

**Aktuella biträden att övervaka:**
- Supabase status: <https://status.supabase.com/>
- Vercel status: <https://www.vercel-status.com/>
- OpenRouter: e-mail support
- Sentry status: <https://status.sentry.io/>

## Förebyggande — kontinuerligt

| Aktivitet | Frekvens | Ansvarig |
|---|---|---|
| Pen-test (extern) | Årligen | DPO + säkerhetskonsult |
| Dependency security-scan | Vid varje PR | CI (GitHub Actions) |
| Backup-restore-test | Kvartalsvis | DevOps |
| RLS-policy-review | Kvartalsvis | Backend-team |
| IR-tabletop-övning | Halvårsvis | DPO + utvecklingsteam |
| Phishing-simulering konsulenter | Halvårsvis | DPO |

## Kontaktlista (vid incident)

- DPO: dpo@jobin.se / [telefon — fyll i]
- Utvecklingsteam: [primary on-call]
- IT-säkerhet: [extern konsult — utse]
- IMY: 08-657 61 00 / imy@imy.se
- Polis: 114 14 (icke-akut), 112 (akut)

---

*Detta dokument är levande. Översyn årligen + efter varje incident (lessons learned).*
