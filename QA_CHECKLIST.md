# QA Checklista – Deltagarportalen
**Datum:** 2026-03-04  
**Version:** 1.0

---

## ✅ Steg 1: RLS-policyer & Cloud Storage

### Testfall: cloudStorage.ts
- [x] Felhantering för RLS (42501) implementerad
- [x] localStorage fallback för alla API-funktioner
- [x] Tyst loggning av policy-fel (inte console.error)
- [x] articleBookmarksApi hanterar fel
- [x] articleProgressApi hanterar fel  
- [x] articleChecklistApi hanterar fel
- [x] dashboardPreferencesApi hanterar fel
- [x] userPreferencesApi hanterar fel

### Verifiering i konsolen
- [ ] Öppna kunskapsbanken → inga 403/42501-fel
- [ ] Klicka på artikel → inga "Failed to save reading progress"
- [ ] Scrolla i artikel → inga fel för progress-sparning

---

## ✅ Steg 2: Tags-migrering

### Testfall: Artikel-taggar
- [x] Alla artiklar har `tags: string[]`
- [x] EnhancedArticle interface har `tags: string[]`
- [x] Article.tsx hanterar både array och string
- [x] KnowledgeBase.tsx hanterar array i sökning
- [x] EnhancedArticleCard.tsx hanterar array korrekt

### Verifiering
- [ ] Kunskapsbanken visar alla artiklar
- [ ] Sök på taggar fungerar
- [ ] Klicka på artikel → inga "tags.split is not a function"
- [ ] Taggar visas korrekt på artikelsidor

---

## ✅ Steg 3: Error Boundary

### Testfall: Global felhantering
- [x] ErrorBoundary komponent skapad
- [x] ErrorBoundary wrappar hela App i main.tsx
- [x] Vänligt felmeddelande vid krasch
- [x] "Ladda om"-knapp fungerar
- [x] "Gå till startsidan"-knapp fungerar
- [x] SectionErrorBoundary för delar av appen
- [x] Dev-mode visar stack trace

### Verifiering
- [ ] Simulera fel i komponent → ErrorBoundary fångar det
- [ ] Vit skärm visas inte vid fel
- [ ] Användaren kan navigera vid fel

---

## 🔄 Steg 4: Integrationstest

### Kunskapsbanken
- [ ] Sidan laddar utan fel
- [ ] Alla artiklar visas (30+)
- [ ] Filter fungerar
- [ ] Sök fungerar
- [ ] Klicka på artikel → artikel visas
- [ ] Tillbaka-knapp fungerar
- [ ] Bokmärkning fungerar (med fallback)
- [ ] Läsprogress sparas (med fallback)

### Övningar
- [ ] Sidan laddar utan fel
- [ ] Alla övningar visas
- [ ] Klicka på övning → övning öppnas
- [ ] Svar sparas (med fallback)
- [ ] Progress fungerar
- [ ] Relaterade artiklar visas

### CV-generator
- [ ] Sidan laddar utan fel
- [ ] Fält kan redigeras
- [ ] Förhandsgranskning fungerar
- [ ] Spara fungerar

### Intresseguide
- [ ] Sidan laddar utan fel
- [ ] Frågor visas
- [ ] Svar sparas
- [ ] Resultat visas

### Jobbsökning
- [ ] Sidan laddar utan fel
- [ ] Sök fungerar
- [ ] Filter fungerar
- [ ] Jobb visas
- [ ] Spara jobb fungerar

---

## 📱 Steg 5: Responsivitet & Tillgänglighet

### Mobil (smal skärm < 768px)
- [ ] Kunskapsbanken är läsbar
- [ ] Artiklar är läsbara
- [ ] Övningar fungerar
- [ ] Navigation fungerar
- [ ] Meny fungerar

### Tablet (768px - 1024px)
- [ ] Layout ser bra ut
- [ ] Ingen horisontell scroll

### Desktop (> 1024px)
- [ ] Layout ser bra ut
- [ ] Alla funktioner tillgängliga

### Tillgänglighet
- [ ] Kontrast är tillräcklig
- [ ] Fokus-indikatorer syns
- [ ] Alt-texter finns på bilder
- [ ] Keyboard-navigering fungerar

---

## 🚀 Steg 6: Prestanda

### Laddningstider
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 4s
- [ ] Inga onödiga renderings

### Bundle size
- [ ] Main bundle < 500KB
- [ ] Lazy loading av routes
- [ ] Bilder är optimerade

### Minnesanvändning
- [ ] Inga minnesläckor vid navigation
- [ ] State rensas korrekt

---

## 🐛 Steg 7: Kända problem (verifiera fixar)

### Tidigare problem
- [ ] ~~RLS 42501-fel~~ → Fixat med fallback
- [ ] ~~Tags.split fel~~ → Fixat med array-check
- [ ] ~~Krasch vid fel~~ → Fixat med ErrorBoundary
- [ ] ~~Reading progress fel~~ → Fixat med tyst hantering

### Nya problem att bevaka
- [ ] Inga nya fel i konsolen
- [ ] Inga vita skärmar
- [ ] Inga oändliga laddningar

---

## 📝 Steg 8: Dokumentation

### Uppdaterad dokumentation
- [x] TEAM_SYNC_2026-03-04.md skapad
- [x] TECH_DEBT.md skapad
- [x] DB_SCHEMA_FIXES.sql skapad
- [x] QA_CHECKLIST.md skapad

### Kod-kommentarer
- [ ] Komplex logik är kommenterad
- [ ] API-funktioner har JSDoc
- [ ] Felhantering är dokumenterad

---

## 🎯 Godkännandekriterier

För att godkänna denna release:

1. **Kritiska fel (P0)**
   - Inga 403/42501-fel som visas för användaren
   - Inga krascher vid normal användning
   - Alla sidor laddar

2. **Höga fel (P1)**
   - Sök fungerar korrekt
   - Filter fungerar korrekt
   - Data sparas (eller fallback används)

3. **Medium fel (P2)**
   - Responsivitet fungerar
   - Prestanda är acceptabel
   - Tillgänglighet är OK

---

## 👥 Signering

| Roll | Namn | Godkänt | Datum |
|------|------|---------|-------|
| QA Lead | [Namn] | [ ] | |
| Frontend Lead | [Namn] | [ ] | |
| Backend Lead | [Namn] | [ ] | |
| Product Owner | [Namn] | [ ] | |

---

## 🚀 Deployment Checklist

Efter QA-godkännande:

- [ ] Alla tester passerade
- [ ] Dokumentation uppdaterad
- [ ] Versionsnummer uppdaterat
- [ ] Changelog uppdaterad
- [ ] Backup av databas
- [ ] Deployment till staging
- [ ] Smoke test på staging
- [ ] Deployment till produktion
- [ ] Verifiering på produktion

---

*Senast uppdaterad: 2026-03-04*
