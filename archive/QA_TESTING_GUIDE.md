# 🧪 QA Testing Guide - Deltagarportalen

> **Syfte:** Säkerställa kvalitet och stabilitet före produktionsrelease
> **Senast uppdaterad:** 2026-03-01

---

## 📋 Test-strategi

### Automatiserade Tester (Vitest)
- ✅ Enhetstester för authStore
- ✅ Enhetstester för API-funktioner
- ✅ Integrationstester för auth-flöden
- 🔄 E2E-tester (Cypress) - Planerat

### Manuella Tester
- 🔍 Funktionell testning
- 🔍 Tillgänglighetstestning (WCAG 2.1 AA)
- 🔍 Prestandatestning (Lighthouse)
- 🔍 Mobil-responsivitet
- 🔍 Cross-browser testning

---

## ✅ Automatiserade Tester

### Köra tester

```bash
# Navigera till client
cd client

# Kör alla tester
npm run test

# Kör tester med UI
npm run test:ui

# Kör tester med coverage
npm run test:coverage

# Kör tester en gång (CI/CD)
npm run test:run
```

### Test Coverage Mål

| Kategori | Mål | Status |
|----------|-----|--------|
| Auth & Login | 90% | ✅ 95% |
| API-funktioner | 80% | ✅ 85% |
| Dashboard | 70% | 🔄 60% |
| Utils & Helpers | 80% | ✅ 82% |

---

## 🔍 Manuell Test-checklista

### 1. Autentisering

#### Login
- [ ] Logga in med giltiga credentials
- [ ] Felmeddelande vid fel lösenord
- [ ] Felmeddelande vid fel email
- [ ] Loading state visas
- [ ] Redirect till dashboard efter login
- [ ] "Kom ihåg mig" fungerar (om implementerad)

#### Register
- [ ] Skapa nytt konto
- [ ] Validering av lösenordsstyrka
- [ ] Felmeddelande om email redan finns
- [ ] Bekräftelse vid framgångsrik registrering
- [ ] Automatisk inloggning efter registrering

#### Logout
- [ ] Logga ut fungerar
- [ ] Redirect till login
- [ ] Session rensas

### 2. Dashboard

#### Widgets
- [ ] Alla widgets visas korrekt
- [ ] CV widget visar rätt progress
- [ ] Jobbsökningswidget laddar jobb
- [ ] Intresseguide-widget visar resultat
- [ ] Widget-filter fungerar
- [ ] Widget-storlekar kan ändras

#### Navigation
- [ ] Sidebar navigation fungerar
- [ ] Mobile navigation fungerar
- [ ] Aktivt menyval markeras
- [ ] Tillbaka-knapp fungerar

### 3. CV Builder

#### Redigering
- [ ] Lägg till arbetslivserfarenhet
- [ ] Lägg till utbildning
- [ ] Lägg till kompetenser
- [ ] Lägg till språk
- [ ] Spara CV
- [ ] Autosave fungerar

#### PDF Export
- [ ] Ladda ner PDF
- [ ] PDF ser korrekt ut
- [ ] Alla sektioner med i PDF
- [ ] Färgschema appliceras

### 4. Jobbsökning

#### Sök
- [ ] Sök på nyckelord
- [ ] Filtrera på plats
- [ ] Filtrera på anställningstyp
- [ ] Sökresultat visas
- [ ] Ladda fler resultat

#### Spara Jobb
- [ ] Spara jobb till lista
- [ ] Visa sparade jobb
- [ ] Uppdatera status på jobb
- [ ] Ta bort sparat jobb

### 5. Konsulent-flöde

#### Inbjudningar
- [ ] Bjud in ny deltagare
- [ ] Email skickas (kolla inbox)
- [ ] Deltagare kan acceptera inbjudan
- [ ] Deltagare kopplas till konsulent

#### Dashboard
- [ ] Visa deltagarlista
- [ ] Filtrera deltagare
- [ ] Visa deltagardetaljer
- [ ] Lägg till anteckningar

### 6. Tillgänglighet (WCAG 2.1 AA)

- [ ] Tangentbordsnavigering fungerar
- [ ] Fokus-indikatorer synliga
- [ ] Alt-texter på bilder
- [ ] Färgkontrast ≥ 4.5:1
- [ ] Skärmläsare läser upp korrekt
- [ ] Text kan förstoras 200%
- [ ] Reduced motion respekteras

### 7. Prestanda

- [ ] Lighthouse score ≥ 90
- [ ] Första innehållsfulla målning < 1.8s
- [ ] Tid till interaktivitet < 3.8s
- [ ] Cumulative Layout Shift < 0.1

---

## 📱 Mobil-testning

### Enheter att testa på:
- [ ] iPhone 12+ (Safari)
- [ ] Android Pixel 6+ (Chrome)
- [ ] iPad Pro (Safari)
- [ ] Samsung Galaxy Tab (Chrome)

### Mobil-specifika tester:
- [ ] Touch-interaktioner fungerar
- [ ] Pinch-to-zoom fungerar
- [ ] Swipe-gester fungerar
- [ ] Input-fält fungerar med mobil-tangentbord
- [ ] Bottom navigation synlig
- [ ] Inga horisontella scrollbars

---

## 🌐 Cross-browser Testning

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Testad |
| Firefox | Latest | 🔄 Väntar |
| Safari | Latest | 🔄 Väntar |
| Edge | Latest | 🔄 Väntar |

---

## 📊 Prestanda-mått

### Lighthouse Targets

| Mått | Target | Acceptabelt | Status |
|------|--------|-------------|--------|
| Performance | 90+ | 80+ | 🔄 |
| Accessibility | 100 | 95+ | 🔄 |
| Best Practices | 100 | 95+ | 🔄 |
| SEO | 100 | 90+ | 🔄 |

### Core Web Vitals

| Mått | Target | Status |
|------|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | 🔄 |
| INP (Interaction to Next Paint) | < 200ms | 🔄 |
| CLS (Cumulative Layout Shift) | < 0.1 | 🔄 |

---

## 🐛 Buggrapportering

### Mall för buggrapport:

```markdown
**Titel:** [Kort beskrivning]
**Allvarlighet:** [Kritisk/Hög/Medel/Låg]
**Miljö:** [Browser/OS/Enhet]
**Steg för att reproducera:**
1. ...
2. ...
3. ...

**Förväntat resultat:**
...

**Faktiskt resultat:**
...

**Skärmdump:**
[Om möjligt]
```

---

## 🎯 Godkännandekriterier för Release

- [ ] Alla automatiserade tester passerar
- [ ] Code coverage ≥ 80%
- [ ] Inga kritiska buggar
- [ ] Inga högprioriterade buggar
- [ ] Lighthouse score ≥ 85 i alla kategorier
- [ ] Mobil-testning klar
- [ ] Tillgänglighetstestning klar (WCAG 2.1 AA)
- [ ] Cross-browser testning klar
- [ ] Prestandatestning klar
- [ ] Dokumentation uppdaterad

---

## 📞 Kontakt

Vid frågor om testning, kontakta:
- QA/Testare: [Namn]
- CTO: [Namn]
- Produktägare: Mikael

---

*Senast uppdaterad: 2026-03-01*
