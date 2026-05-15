# GDPR Art 30 — Register över behandlingar

**Lagkrav:** GDPR Art 30 (registerförteckning över behandlingar).
**Datum:** 2026-05-15
**Personuppgiftsansvarig:** [Företagsnamn — fyll i]
**Kontakt DPO:** dpo@jobin.se

---

## Behandlingar

### B1: Användarkonton & autentisering

| Aspekt | Värde |
|---|---|
| Ändamål | Identifiera användare, säker inloggning, sessionshantering |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare, konsulenter, administratörer |
| Kategorier personuppgifter | Email, namn, lösenordshash, sessionstoken, senaste inloggning |
| Kategorier mottagare | Supabase Auth (biträde), användaren själv |
| Tredjelandsöverföring | Nej (Supabase EU/Irland) |
| Gallring | Tills användaren raderar konto + 30 dagar för säkerhetsloggar |
| Säkerhetsåtgärder | bcrypt-hashing, JWT med kort livstid, RLS på `auth.users` |
| Tabeller | `auth.users`, `profiles` |

### B2: Användarprofil

| Aspekt | Värde |
|---|---|
| Ändamål | Personalisering, deltagaresinformation till konsulent |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare |
| Kategorier personuppgifter | Namn, ort, ålder, telefon, profilbild, språk, utbildning, drömjobb |
| Mottagare | Tilldelad konsulent (om datadelning godkänd) |
| Tredjelandsöverföring | Nej |
| Gallring | Med konto-radering |
| Säkerhetsåtgärder | RLS `auth.uid() = id`, audit via `consent_history` |
| Tabeller | `profiles`, `user_adaptations` |

### B3: CV och jobbansökningar

| Aspekt | Värde |
|---|---|
| Ändamål | Hjälpa användaren skapa CV, bevara historik |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare |
| Kategorier personuppgifter | Yrkeshistorik, utbildning, kompetenser, kontaktuppgifter, fritext |
| Mottagare | Tilldelad konsulent (om delning godkänd), Vercel Blob (CV-PDF) |
| Tredjelandsöverföring | Vercel Blob region måste verifieras (sannolikt EU efter åtgärd) |
| Gallring | Med konto-radering eller manuell borttagning |
| Säkerhetsåtgärder | RLS, AES-256 at rest, magic-byte-validering vid upload |
| Tabeller | `cvs`, `cv_versions`, `applications`, `cover_letters` |

### B4: Hälsodata (Art 9 — uttryckligt samtycke)

| Aspekt | Värde |
|---|---|
| Ändamål | Anpassa portalen efter användarens energinivå, kognitiva och funktionsmässiga behov |
| Rättslig grund | Uttryckligt samtycke (Art 9.2.a) — `HealthConsentGate` |
| Kategorier registrerade | Deltagare som aktivt slagit på hälsodata-stöd |
| Kategorier personuppgifter | Energinivå, kognitiv kapacitet, kommunikationsstil, motorik, sensorisk, koncentration, funktionsanpassningar |
| Mottagare | Tilldelad konsulent **endast** om `participant_data_sharing.share_health_data = true` |
| Tredjelandsöverföring | Nej (lagring i EU) |
| Gallring | Med samtyckeåterkall eller konto-radering |
| Säkerhetsåtgärder | RLS via `check_health_consent()`-funktion, audit-loggning vid varje delning |
| Tabeller | `interest_results`, `user_adaptations`, `participant_data_sharing` |

### B5: Wellness & dagbok (Art 9)

| Aspekt | Värde |
|---|---|
| Ändamål | Användarens egen reflektion, mental hälsostöd |
| Rättslig grund | Uttryckligt samtycke (Art 9.2.a) — `WellnessConsentGate` |
| Kategorier registrerade | Deltagare som aktivt använder wellness-modul |
| Kategorier personuppgifter | Mood-loggar, dagboksinlägg, gratitude-listor, energi-spårning |
| Mottagare | Endast användaren själv (default) |
| Tredjelandsöverföring | Nej |
| Gallring | Med användares borttagning eller konto-radering |
| Säkerhetsåtgärder | RLS, ej delningsbart med konsulent som default |
| Tabeller | `mood_logs`, `diary_entries`, `gratitude_entries`, `energy_history` |

### B6: AI-funktioner (samtycke)

| Aspekt | Värde |
|---|---|
| Ändamål | Generera CV-text, brev, intervjutips, karriärplaner, coachning |
| Rättslig grund | Samtycke (Art 6.1.a) — `AiConsentGate` |
| Kategorier registrerade | Deltagare som aktiverat AI-funktioner |
| Kategorier personuppgifter | Promptar (kan innehålla CV-data, frågor, kontext), AI-output |
| Mottagare | OpenRouter Inc. (USA — biträde) |
| Tredjelandsöverföring | **JA — USA**. Krav: SCC + TIA. OpenRouters DPF-status MÅSTE verifieras |
| Gallring | `ai_usage_logs` raderas efter 90 dagar (cron) |
| Säkerhetsåtgärder | TLS, OpenRouter-villkor förbjuder modellträning på input, rate-limit, daglig token-cap |
| Tabeller | `ai_usage_logs`, `ai_team_sessions` |

### B7: Konsulent-deltagare-koppling

| Aspekt | Värde |
|---|---|
| Ändamål | Konsulent kan ge stöd till tilldelad deltagare |
| Rättslig grund | Avtal (Art 6.1.b) + samtycke för specifika datakategorier (Art 6.1.a) |
| Kategorier registrerade | Konsulenter, deltagare |
| Kategorier personuppgifter | Konsulent-ID, deltagar-ID, tilldelningsdatum, datakategori-flaggor |
| Mottagare | Konsulentens organisation |
| Tredjelandsöverföring | Nej |
| Gallring | Vid avregistrering av deltagare eller bytet av konsulent |
| Säkerhetsåtgärder | RLS, granulär datadelning per kategori, full audit-trail |
| Tabeller | `consultant_participants`, `participant_data_sharing`, `data_sharing_audit` |

### B8: Säkerhetsloggning (Sentry)

| Aspekt | Värde |
|---|---|
| Ändamål | Felövervakning, säkerhetsincident-detektering |
| Rättslig grund | Berättigat intresse (Art 6.1.f) — efter cookie-consent |
| Kategorier registrerade | Alla användare (efter consent) |
| Kategorier personuppgifter | `user.id` (inte email), error stack traces, browser info |
| Mottagare | Sentry / Functional Software Inc. (multi-region) |
| Tredjelandsöverföring | Sentry sannolikt USA — bör migrera till sentry.io/eu |
| Gallring | 90 dagar (Sentry default) |
| Säkerhetsåtgärder | Lazy-load bakom cookie-consent, PII-strip av email, auth headers, cookies |
| Lokal config | `client/src/lib/sentry.ts` |

### B9: Cookie- och samtyckeshistorik

| Aspekt | Värde |
|---|---|
| Ändamål | Bevisa samtyckesgrund, accountability (Art 5.2) |
| Rättslig grund | Rättslig förpliktelse (Art 6.1.c) — GDPR-krav |
| Kategorier registrerade | Alla användare som ger eller drar tillbaka samtycke |
| Kategorier personuppgifter | User-ID, samtyckestyp, IP, user agent, tidstämpel, version av text |
| Mottagare | Endast intern administration |
| Tredjelandsöverföring | Nej |
| Gallring | 5 år (juridisk preskription) |
| Säkerhetsåtgärder | RLS, ej raderingsbart av användaren själv |
| Tabeller | `consent_history`, `user_consent_status` (vy) |

### B10: Tredjepartsintegrationer (opt-in)

| Aspekt | Värde |
|---|---|
| Ändamål | Användarens valbara integrationer |
| Rättslig grund | Samtycke (Art 6.1.a) per integration |
| Kategorier registrerade | Deltagare som aktiverat integration |
| Kategorier personuppgifter | OAuth-tokens, importerad profildata (LinkedIn), kalenderhändelser (Google) |
| Mottagare | LinkedIn Inc., Google LLC |
| Tredjelandsöverföring | **JA — USA** för båda. Skyddsåtgärd: OAuth, opt-in, lagras pseudonymiserat |
| Gallring | Med integration-borttagning eller konto-radering |
| Säkerhetsåtgärder | OAuth refresh-token, rate-limiting på endpoints |
| Tabeller | `user_credentials`, `linkedin_profiles`, `calendar_events` |

### B11: AF / Bolagsverket / Arbetsförmedlingen-integrationer

| Aspekt | Värde |
|---|---|
| Ändamål | Söka jobb, hämta utbildningsförslag, företagsinformation |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare som söker jobb/företag |
| Kategorier personuppgifter | **Inga utgående persondata** — bara sökord/ID:n |
| Mottagare | Arbetsförmedlingen, Bolagsverket (publika API:er) |
| Tredjelandsöverföring | Nej (svenska myndigheter) |
| Gallring | Bara cache (max 24h) |
| Säkerhetsåtgärder | Edge functions med JWT-check + rate-limit |
| Funktioner | `bolagsverket`, `af-*` edge functions |

### B12: Account-deletion-grace period

| Aspekt | Värde |
|---|---|
| Ändamål | 14-dagars ångerperiod efter användares raderingsbegäran |
| Rättslig grund | Avtal (Art 6.1.b) — del av Art 17-implementation |
| Kategorier registrerade | Användare som begärt radering |
| Kategorier personuppgifter | User-ID, begärandes-tidpunkt, planerad raderingstid |
| Mottagare | Endast intern process |
| Tredjelandsöverföring | Nej |
| Gallring | Vid genomförd radering eller återkall |
| Säkerhetsåtgärder | RLS, edge function `delete-account` med service role |
| Tabeller | `account_deletion_requests`, `admin_audit_log` |

---

## Personuppgiftsansvarig — kontaktuppgifter

| Roll | Person/funktion | Email |
|---|---|---|
| Personuppgiftsansvarig | [Företagsnamn / juridisk person — fyll i] | [contact-email] |
| Dataskyddsombud (DPO) | [Namn — utse formellt eller dokumentera varför inte krävs] | dpo@jobin.se |
| Tillsynsmyndighet | Integritetsskyddsmyndigheten (IMY) | imy.se |

---

## Personuppgiftsbiträden

| Biträde | Roll | DPA-status | Region | Anmärkning |
|---|---|---|---|---|
| Supabase Inc. | DB, Auth, Storage | DPA på supabase.com | EU/Irland | OK |
| Vercel Inc. | Hosting, serverless functions | DPA på vercel.com | EU/Frankfurt (efter 2026-05-15) | OK |
| Vercel Blob | Filhosting | Del av Vercel-DPA | **Verifieras** | Manuell check |
| OpenRouter Inc. | AI inferens | **Verifieras** | USA | SCC + TIA krävs |
| Functional Software (Sentry) | Error tracking | DPA på sentry.io | Multi-region | EU-instans rekommenderad |
| LinkedIn Inc. | OAuth + profilimport | DPA via LinkedIn | USA | Opt-in, SCC krävs |
| Google LLC | OAuth + Calendar | DPA via Google | USA | Opt-in, SCC krävs |
| Resend / Postmark (om används) | Email | (verifiera) | (verifiera) | Annars Supabase Auth-email |

---

*Detta register uppdateras vid varje ny behandling, ny mottagare eller ändring av rättslig grund.*
