# BLOCK — Fas D-uppgifter som kräver din input

**Datum:** 2026-05-15
**Av:** Tech-debt-roadmap-autonomous-loop

Tre Fas D-uppgifter är blockerade på saker bara du kan göra. De påverkar inte koden direkt — bara CI-konfiguration och GitHub-inställningar.

## D1 — Aktivera authenticated E2E i CI

**Vad som behövs:**

1. Skapa en testanvändare i Supabase (eller använd staging-projekt):
   ```sql
   -- I Supabase SQL Editor, eller via signup-flödet
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('e2e-test@jobin.se', crypt('TestPass123!', gen_salt('bf')), NOW());
   ```

2. Lägg till GitHub Secrets (Settings → Secrets and variables → Actions):
   - `TEST_USER_EMAIL` = e2e-test@jobin.se
   - `TEST_USER_PASSWORD` = TestPass123!

3. Uppdatera `.github/workflows/ci.yml` att köra alla `e2e/*.spec.ts`:
   ```yaml
   - name: Run authenticated E2E tests
     env:
       TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
       TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
     run: npx playwright test e2e/ --project=chromium
   ```

**Varför blockerat:** Jag kan inte skapa GitHub Secrets eller test-användare i prod-DB åt dig.

## D3 — Konsulent-E2E golden path

Beror på D1. När D1 är klar:

```bash
# Konvertera engångsskriptet till spec
git mv e2e/sta-consultant-addparticipant.cjs e2e/consultant.spec.ts
# Lägg till test.skip-guard utan TEST_USER_EMAIL (samma mönster som dashboard.spec.ts)
```

Spec innehåll: login (konsulent) → addParticipant → tilldela uppgift → följ upp.

## D4 — PDF-export E2E

Beror på D1. När D1 är klar:

Skapa `e2e/pdf-export.spec.ts` som:
1. Login som testanvändare
2. Navigera till /cv
3. Skapa minimal CV (skip om det redan finns)
4. Exportera PDF
5. Verifiera Content-Disposition + Content-Type-headers
6. (Bonus) Spara PDF lokalt och verifiera storlek > 10 KB

Bygg på `e2e/cv-print-pdf.cjs` som redan har grundlogiken.

---

## Vad jag gjorde istället under natten

Eftersom D1, D3, D4 var blockerade gjorde jag:
- D2 (4 service-tester) — autonomt
- D5 (coverage-tröskel) — autonomt
- D6 (Husky + lint-staged) — autonomt
- D7 (useFocusTrap-konsolidering) — autonomt
- D8 (CV-mall-snapshots) — autonomt

Och fortsatte sedan till Fas E och F (där det inte fanns blockers).

---

*När du har D1 klart, säg till så fortsätter jag med D3 + D4 + verifierar att de 5 authenticated specs (cv, dashboard, cover-letter, job-search, login) körs grönt i CI.*
