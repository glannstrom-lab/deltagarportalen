# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> Login Page >> should display login form
- Location: e2e\auth.spec.ts:5:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /välkommen tillbaka/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /välkommen tillbaka/i })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - navigation [ref=e5]:
    - generic [ref=e7]:
      - link "jobin.se jobin.se" [ref=e8] [cursor=pointer]:
        - /url: "#/"
        - img "jobin.se" [ref=e9]
        - generic [ref=e10]: jobin.se
      - generic [ref=e11]:
        - button "Funktioner" [ref=e12]
        - button "Så funkar det" [ref=e13]
        - button "Priser" [ref=e14]
        - link "Logga in" [ref=e15] [cursor=pointer]:
          - /url: "#/login"
        - link "Kom igång" [ref=e16] [cursor=pointer]:
          - /url: "#/register"
  - generic [ref=e21]:
    - paragraph [ref=e22]: Komplett plattform för arbetsmarknadstjänster
    - heading "Stärk dina deltagare mot jobb" [level=1] [ref=e23]
    - paragraph [ref=e24]: En komplett digital plattform för jobbcoacher och arbetsmarknadsaktörer. Ge dina deltagare moderna verktyg för CV-skapande, jobbsökning och karriärutveckling – med full insyn och uppföljning för dig som konsulent.
    - generic [ref=e25]:
      - link "Boka en demo" [ref=e26] [cursor=pointer]:
        - /url: "#/register"
        - text: Boka en demo
        - img [ref=e27]
      - button "Funktioner" [ref=e29]
    - generic [ref=e30]:
      - generic [ref=e31]:
        - img [ref=e32]
        - generic [ref=e34]: Gratis för deltagare
      - generic [ref=e35]:
        - img [ref=e36]
        - generic [ref=e38]: GDPR-säkrad
      - generic [ref=e39]:
        - img [ref=e40]
        - generic [ref=e42]: Kom igång på 2 minuter
  - generic [ref=e45]:
    - generic [ref=e46]:
      - paragraph [ref=e47]: 5 000+
      - paragraph [ref=e48]: aktiva användare
    - generic [ref=e50]:
      - generic [ref=e51]:
        - img [ref=e52]
        - img [ref=e54]
        - img [ref=e56]
        - img [ref=e58]
        - img [ref=e60]
      - paragraph [ref=e62]: betyg från användare
    - generic [ref=e64]:
      - paragraph [ref=e65]: 30+
      - paragraph [ref=e66]: Kommuner
  - generic [ref=e68]:
    - generic [ref=e69]:
      - paragraph [ref=e70]: Funktioner
      - heading "Allt du behöver i en plattform" [level=2] [ref=e71]
      - paragraph [ref=e72]: Från att upptäcka vad du vill göra till att landa drömjobbet – vi har verktygen som hjälper dig.
    - generic [ref=e73]:
      - generic [ref=e74]:
        - img [ref=e76]
        - heading "CV som faktiskt blir läst" [level=3] [ref=e79]
        - paragraph [ref=e80]: Skapa ett professionellt CV med hjälp av AI – optimerat för både rekryterare och datorer. Importera från LinkedIn, få feedback direkt och exportera som PDF när du är nöjd.
      - generic [ref=e81]:
        - img [ref=e83]
        - heading "Upptäck vad du är bra på" [level=3] [ref=e85]
        - paragraph [ref=e86]: Vårt personlighetstest hjälper dig förstå dina styrkor och intressen. Få förslag på yrken som passar just dig.
      - generic [ref=e87]:
        - img [ref=e89]
        - heading "Fler jobb, mindre letande" [level=3] [ref=e92]
        - paragraph [ref=e93]: Sök bland tusentals jobb från hela Sverige med smarta filter. Se direkt på kartan var jobben finns.
      - generic [ref=e94]:
        - img [ref=e96]
        - heading "Förbered dig inför intervjun" [level=3] [ref=e99]
        - paragraph [ref=e100]: Öva med vår intervjutränerare, lär dig STAR-metoden och gå in på intervjun med självförtroende.
      - generic [ref=e101]:
        - img [ref=e103]
        - heading "Må bra under tiden" [level=3] [ref=e105]
        - paragraph [ref=e106]: Din välmående är viktigast. Med dagbok, reflektionsövningar och stödjande verktyg håller du balansen.
      - generic [ref=e107]:
        - img [ref=e109]
        - heading "Karriärcoachen" [level=3] [ref=e112]
        - paragraph [ref=e113]: Få personliga råd om löneutveckling, kompetensutveckling och hur du navigerar din karriär framåt.
  - generic [ref=e115]:
    - generic [ref=e116]:
      - paragraph [ref=e117]: Processen
      - heading "Så här fungerar det" [level=2] [ref=e118]
      - paragraph [ref=e119]: Tre enkla steg på din väg till nytt jobb. Vi guidar dig genom varje del.
    - generic [ref=e120]:
      - generic [ref=e121]:
        - generic [ref=e122]:
          - generic [ref=e123]: "1"
          - heading "Upptäck dina styrkor" [level=3] [ref=e124]
          - paragraph [ref=e125]: Gör vår intresseguide och förstå vad du är bra på. Få förslag på yrken som passar just dig.
        - img [ref=e127]
      - generic [ref=e129]:
        - generic [ref=e130]:
          - generic [ref=e131]: "2"
          - heading "Skapa ditt CV" [level=3] [ref=e132]
          - paragraph [ref=e133]: Använd vår AI-stödda CV-generator. Optimera för ATS, importera från LinkedIn, exportera som PDF.
        - img [ref=e135]
      - generic [ref=e138]:
        - generic [ref=e139]: "3"
        - heading "Hitta och sök jobb" [level=3] [ref=e140]
        - paragraph [ref=e141]: Sök bland tusentals jobb, förbered dig med intervjuträningen och håll koll på dina ansökningar.
  - generic [ref=e143]:
    - generic [ref=e144]:
      - paragraph [ref=e145]: Priser
      - heading "Enkel och transparent prissättning" [level=2] [ref=e146]
      - paragraph [ref=e147]: Välj det upplägg som passar din organisation. Inga dolda avgifter.
    - generic [ref=e148]:
      - generic [ref=e149]:
        - generic [ref=e150]: Populärast
        - heading "Organisationslicens" [level=3] [ref=e151]
        - paragraph [ref=e152]: Grundlicens för din organisation med tillgång till hela plattformen.
        - generic [ref=e153]:
          - text: 2 990
          - generic [ref=e154]: kr/månad
        - list [ref=e155]:
          - listitem [ref=e156]:
            - img [ref=e157]
            - generic [ref=e159]: Obegränsat antal deltagare
          - listitem [ref=e160]:
            - img [ref=e161]
            - generic [ref=e163]: Admin-panel med statistik
          - listitem [ref=e164]:
            - img [ref=e165]
            - generic [ref=e167]: Deltagaruppföljning
          - listitem [ref=e168]:
            - img [ref=e169]
            - generic [ref=e171]: Gruppadministration
          - listitem [ref=e172]:
            - img [ref=e173]
            - generic [ref=e175]: API-integrationer
          - listitem [ref=e176]:
            - img [ref=e177]
            - generic [ref=e179]: Prioriterad support
          - listitem [ref=e180]:
            - img [ref=e181]
            - generic [ref=e183]: SSO-inloggning (tillval)
          - listitem [ref=e184]:
            - img [ref=e185]
            - generic [ref=e187]: Anpassad branding (tillval)
        - link "Kontakta oss" [ref=e188] [cursor=pointer]:
          - /url: mailto:sales@jobin.se
      - generic [ref=e189]:
        - heading "Per konsulent" [level=3] [ref=e190]
        - paragraph [ref=e191]: Licens per aktiv konsulent/jobbcoach som använder plattformen.
        - generic [ref=e192]:
          - text: "290"
          - generic [ref=e193]: kr/månad
        - list [ref=e194]:
          - listitem [ref=e195]:
            - img [ref=e196]
            - generic [ref=e198]: Egen konsultvy
          - listitem [ref=e199]:
            - img [ref=e200]
            - generic [ref=e202]: Hantera egna deltagare
          - listitem [ref=e203]:
            - img [ref=e204]
            - generic [ref=e206]: Chattfunktion
          - listitem [ref=e207]:
            - img [ref=e208]
            - generic [ref=e210]: Anteckningar & uppföljning
          - listitem [ref=e211]:
            - img [ref=e212]
            - generic [ref=e214]: Delad kalender
          - listitem [ref=e215]:
            - img [ref=e216]
            - generic [ref=e218]: Progressrapporter
          - listitem [ref=e219]:
            - img [ref=e220]
            - generic [ref=e222]: CV-granskning
          - listitem [ref=e223]:
            - img [ref=e224]
            - generic [ref=e226]: Jobbmatchning
        - link "Kontakta oss" [ref=e227] [cursor=pointer]:
          - /url: mailto:sales@jobin.se
      - generic [ref=e228]:
        - heading "Deltagare" [level=3] [ref=e229]
        - paragraph [ref=e230]: Alltid gratis för deltagare – inga kostnader överhuvudtaget.
        - generic [ref=e231]: Gratis
        - list [ref=e232]:
          - listitem [ref=e233]:
            - img [ref=e234]
            - generic [ref=e236]: AI-stödd CV-byggare
          - listitem [ref=e237]:
            - img [ref=e238]
            - generic [ref=e240]: Personligt brev-generator
          - listitem [ref=e241]:
            - img [ref=e242]
            - generic [ref=e244]: Intresseguide (RIASEC)
          - listitem [ref=e245]:
            - img [ref=e246]
            - generic [ref=e248]: Jobbsökning med filter
          - listitem [ref=e249]:
            - img [ref=e250]
            - generic [ref=e252]: Intervjuträning
          - listitem [ref=e253]:
            - img [ref=e254]
            - generic [ref=e256]: Karriärcoach
          - listitem [ref=e257]:
            - img [ref=e258]
            - generic [ref=e260]: Dagbok & välmående
          - listitem [ref=e261]:
            - img [ref=e262]
            - generic [ref=e264]: Kunskapsbank
        - link "Kom igång gratis" [ref=e265] [cursor=pointer]:
          - /url: "#/register"
  - generic [ref=e267]:
    - generic [ref=e268]:
      - paragraph [ref=e269]: FAQ
      - heading "Vanliga frågor" [level=2] [ref=e270]
    - generic [ref=e271]:
      - generic [ref=e273]:
        - button "Vad kostar Jobin?" [ref=e274]:
          - generic [ref=e275]: Vad kostar Jobin?
          - img [ref=e276]
        - paragraph [ref=e278]: Jobin är alltid gratis för deltagare. Organisationer betalar en fast licens på 2 990 kr/månad plus 290 kr per aktiv konsulent. Inga dolda avgifter – alla funktioner ingår.
      - generic [ref=e280]:
        - button "Jag har sökt jobb länge utan resultat. Kan Jobin verkligen hjälpa mig?" [ref=e281]:
          - generic [ref=e282]: Jag har sökt jobb länge utan resultat. Kan Jobin verkligen hjälpa mig?
          - img [ref=e283]
        - paragraph [ref=e285]: Absolut. Många av våra användare har varit långtidsarbetslösa och har med hjälp av våra strukturerade verktyg och personliga vägledning tagit sig tillbaka till arbete. Du är inte ensam, och det finns vägar framåt. Verktygen är speciellt utformade för att ge stöd även när det känns tufft.
      - generic [ref=e287]:
        - button "Jag vet inte ens vad jag vill jobba med. Var ska jag börja?" [ref=e288]:
          - generic [ref=e289]: Jag vet inte ens vad jag vill jobba med. Var ska jag börja?
          - img [ref=e290]
        - paragraph [ref=e292]: Börja med vår intresseguide! Den hjälper dig utforska dina styrkor och intressen, och ger förslag på yrken som kan passa dig. Ingen press – bara upptäckande. Många användare har upptäckt nya karriärvägar de aldrig tänkt på tidigare.
      - generic [ref=e294]:
        - button "Är mina personuppgifter säkra?" [ref=e295]:
          - generic [ref=e296]: Är mina personuppgifter säkra?
          - img [ref=e297]
        - paragraph [ref=e299]: Ja, vi tar din integritet på största allvar. Dina uppgifter sparas säkert med modern kryptering och delas aldrig med tredje part utan ditt samtycke. Du äger alltid dina data och kan när som helst ta bort ditt konto. Vi följer GDPR och har tydliga rutiner för datasäkerhet.
      - generic [ref=e301]:
        - button "Hur fungerar AI-hjälpen i CV-generatorn?" [ref=e302]:
          - generic [ref=e303]: Hur fungerar AI-hjälpen i CV-generatorn?
          - img [ref=e304]
        - paragraph [ref=e306]: Vår AI analyserar din erfarenhet och föreslår förbättringar i text, struktur och nyckelord. Den hjälper dig formulera dina styrkor på ett sätt som både rekryterare och automatiska system (ATS) uppskattar. Du har alltid full kontroll och kan redigera allt.
      - generic [ref=e308]:
        - button "Kan jag använda Jobin på mobilen?" [ref=e309]:
          - generic [ref=e310]: Kan jag använda Jobin på mobilen?
          - img [ref=e311]
        - paragraph [ref=e313]: Ja! Jobin är fullt responsivt och fungerar utmärkt på både mobil, surfplatta och dator. Du kan söka jobb, uppdatera ditt CV och göra intervjuträning var du än befinner dig.
  - generic [ref=e315]:
    - heading "Redo att stärka dina arbetsmarknadsinsatser?" [level=2] [ref=e316]
    - paragraph [ref=e317]: Ge dina deltagare verktygen de behöver för att lyckas. Boka en demo och se hur Jobin kan effektivisera er verksamhet.
    - link "Boka demo" [ref=e318] [cursor=pointer]:
      - /url: "#/register"
      - text: Boka demo
      - img [ref=e319]
    - paragraph [ref=e321]: Ingen bindningstid. Inga startavgifter. Kom igång inom 24 timmar.
  - contentinfo [ref=e322]:
    - generic [ref=e323]:
      - generic [ref=e324]:
        - generic [ref=e325]:
          - generic [ref=e326]:
            - img "jobin.se" [ref=e327]
            - generic [ref=e328]: jobin.se
          - paragraph [ref=e329]: Jobin är en komplett digital plattform för arbetsmarknadstjänster. Vi hjälper organisationer stötta arbetssökande med moderna verktyg.
        - generic [ref=e330]:
          - heading "Funktioner" [level=4] [ref=e331]
          - list [ref=e332]:
            - listitem [ref=e333]:
              - link "CV-generator" [ref=e334] [cursor=pointer]:
                - /url: "#/register"
            - listitem [ref=e335]:
              - link "Intresseguide" [ref=e336] [cursor=pointer]:
                - /url: "#/register"
            - listitem [ref=e337]:
              - link "Jobbsök" [ref=e338] [cursor=pointer]:
                - /url: "#/register"
        - generic [ref=e339]:
          - heading "Om Jobin" [level=4] [ref=e340]
          - list [ref=e341]:
            - listitem [ref=e342]:
              - link "Kontakt" [ref=e343] [cursor=pointer]:
                - /url: mailto:support@jobin.se
            - listitem [ref=e344]:
              - link "Integritetspolicy" [ref=e345] [cursor=pointer]:
                - /url: "#/privacy"
            - listitem [ref=e346]:
              - link "Användarvillkor" [ref=e347] [cursor=pointer]:
                - /url: "#/terms"
        - generic [ref=e348]:
          - heading "Konto" [level=4] [ref=e349]
          - list [ref=e350]:
            - listitem [ref=e351]:
              - link "Logga in" [ref=e352] [cursor=pointer]:
                - /url: "#/login"
            - listitem [ref=e353]:
              - link "Skapa konto" [ref=e354] [cursor=pointer]:
                - /url: "#/register"
      - generic [ref=e355]:
        - paragraph [ref=e356]: © 2026 Jobin. Alla rättigheter förbehållna.
        - link "support@jobin.se" [ref=e357] [cursor=pointer]:
          - /url: mailto:support@jobin.se
          - img [ref=e358]
          - text: support@jobin.se
```

# Test source

```ts
  1   | import { test, expect, TEST_USER, waitForAppReady } from './fixtures'
  2   | 
  3   | test.describe('Authentication', () => {
  4   |   test.describe('Login Page', () => {
  5   |     test('should display login form', async ({ page }) => {
  6   |       await page.goto('/#/login')
  7   |       await waitForAppReady(page)
  8   | 
  9   |       // Check page title and heading
> 10  |       await expect(page.getByRole('heading', { name: /välkommen tillbaka/i })).toBeVisible()
      |                                                                                ^ Error: expect(locator).toBeVisible() failed
  11  | 
  12  |       // Check form elements - use more specific locators
  13  |       await expect(page.locator('input#email')).toBeVisible()
  14  |       await expect(page.locator('input#password')).toBeVisible()
  15  |       await expect(page.getByRole('button', { name: /^logga in$/i })).toBeVisible()
  16  | 
  17  |       // Check for register link
  18  |       await expect(page.getByRole('link', { name: /skapa ett konto/i })).toBeVisible()
  19  |     })
  20  | 
  21  |     test('should show validation errors for empty form submission', async ({ page }) => {
  22  |       await page.goto('/#/login')
  23  |       await waitForAppReady(page)
  24  | 
  25  |       // Submit empty form
  26  |       await page.getByRole('button', { name: /^logga in$/i }).click()
  27  | 
  28  |       // Should show validation errors - use first alert
  29  |       const alerts = page.getByRole('alert').first()
  30  |       await expect(alerts).toBeVisible()
  31  |     })
  32  | 
  33  |     test('should show error for invalid email format', async ({ page }) => {
  34  |       await page.goto('/#/login')
  35  |       await waitForAppReady(page)
  36  | 
  37  |       // Fill invalid email
  38  |       await page.locator('input#email').fill('notanemail')
  39  |       await page.locator('input#password').fill('password123')
  40  |       await page.locator('input#password').blur()
  41  | 
  42  |       // Tab away to trigger validation
  43  |       await page.getByRole('button', { name: /^logga in$/i }).click()
  44  | 
  45  |       // Should show email validation error
  46  |       await expect(page.getByRole('alert').first()).toBeVisible()
  47  |     })
  48  | 
  49  |     test('should toggle password visibility', async ({ page }) => {
  50  |       await page.goto('/#/login')
  51  |       await waitForAppReady(page)
  52  | 
  53  |       const passwordInput = page.locator('input#password')
  54  |       const toggleButton = page.getByRole('button', { name: /visa lösenord|dölj lösenord/i })
  55  | 
  56  |       // Initially password should be hidden
  57  |       await expect(passwordInput).toHaveAttribute('type', 'password')
  58  | 
  59  |       // Click toggle to show password
  60  |       await toggleButton.click()
  61  |       await expect(passwordInput).toHaveAttribute('type', 'text')
  62  | 
  63  |       // Click toggle to hide password again
  64  |       await toggleButton.click()
  65  |       await expect(passwordInput).toHaveAttribute('type', 'password')
  66  |     })
  67  | 
  68  |     test('should show error for invalid credentials', async ({ page }) => {
  69  |       await page.goto('/#/login')
  70  |       await waitForAppReady(page)
  71  | 
  72  |       // Fill with invalid credentials
  73  |       await page.locator('input#email').fill('invalid@example.com')
  74  |       await page.locator('input#password').fill('wrongpassword')
  75  |       await page.getByRole('button', { name: /^logga in$/i }).click()
  76  | 
  77  |       // Should show error message
  78  |       await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 })
  79  |       await expect(page.getByRole('alert').first()).toContainText(/fel|invalid|ogiltigt/i)
  80  |     })
  81  | 
  82  |     test('should redirect authenticated users to dashboard', async ({ page, auth }) => {
  83  |       // Skip if no test credentials configured
  84  |       test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
  85  | 
  86  |       await auth.login(TEST_USER.email, TEST_USER.password)
  87  | 
  88  |       // Should be on dashboard
  89  |       await expect(page).toHaveURL('/')
  90  | 
  91  |       // Visit login page should redirect back
  92  |       await page.goto('/#/login')
  93  |       await expect(page).toHaveURL('/')
  94  |     })
  95  | 
  96  |     test('should be accessible', async ({ page }) => {
  97  |       await page.goto('/#/login')
  98  |       await waitForAppReady(page)
  99  | 
  100 |       // Check for proper form labels
  101 |       const emailInput = page.locator('input#email')
  102 |       const passwordInput = page.locator('input#password')
  103 | 
  104 |       // Inputs should have associated labels
  105 |       await expect(emailInput).toHaveAttribute('id')
  106 |       await expect(passwordInput).toHaveAttribute('id')
  107 | 
  108 |       // Check for autocomplete attributes
  109 |       await expect(emailInput).toHaveAttribute('autocomplete', 'email')
  110 |       await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
```