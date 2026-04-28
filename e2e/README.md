# E2E-tester (Playwright)

## Vad som körs i CI nu

`smoke.spec.ts` körs automatiskt på varje PR och push:
- Landing page laddas utan JS-fel
- Login/register-sidor renderar formulär
- Privacy + AI-policy är tillgängliga
- Skyddade sidor redirectar oautentiserad till login

Inga credentials krävs — alla testerna är på public sidor.

## Aktivera authenticated-tester (cv, dashboard, cover-letter, job-search)

De andra spec-filerna (`auth.spec.ts`, `cv.spec.ts`, etc.) kräver en
test-användare i Supabase. För att aktivera i CI:

### 1. Skapa test-user i Supabase
```sql
-- Kör i Supabase SQL Editor
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  gen_random_uuid(),
  'test+e2e@deltagarportalen.se',
  crypt('byt-detta-långa-lösenord-här', gen_salt('bf')),
  NOW()
);
```

Rekommendation: skapa hellre en separat test-databas eller -projekt om
möjligt, så test-data inte krockar med riktiga användare.

### 2. Lägg till GitHub Secrets
- `TEST_USER_EMAIL` = `test+e2e@deltagarportalen.se`
- `TEST_USER_PASSWORD` = lösenordet ovan
- (consultant-tester) `TEST_CONSULTANT_EMAIL` + `TEST_CONSULTANT_PASSWORD`

### 3. Lägg till job i `.github/workflows/ci.yml`
Kopiera `e2e-smoke`-jobbet och byt:
- Namnet till `e2e-authenticated`
- Steget till: `npx playwright test e2e/auth.spec.ts e2e/cv.spec.ts e2e/dashboard.spec.ts ...`
- Lägg till env: `TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}` etc.

### 4. (Valfritt) Cleanup mellan tester
Test-användarens data fylls med varje test. Lägg till en `afterEach` som
nollställer profile/cv via Supabase RPC:
```sql
CREATE FUNCTION reset_test_user(p_email text) RETURNS void AS $$
BEGIN
  DELETE FROM cvs WHERE user_id = (SELECT id FROM auth.users WHERE email = p_email);
  DELETE FROM cover_letters WHERE user_id = (...);
  -- etc.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Lokal körning

```bash
# Smoke-tester (ingen auth)
npx playwright test e2e/smoke.spec.ts --project=chromium

# Med UI för debugging
npx playwright test --ui

# Specifik test
npx playwright test cv -g "kan spara CV"

# Visa rapport
npx playwright show-report
```

Webserver startas automatiskt via `playwright.config.ts` (npm run dev:client).
Om du redan har dev-servern igång, sätt `PLAYWRIGHT_BASE_URL=http://localhost:3002`
för att hoppa över auto-start.
