# Design Sprint - Deltagarportalen Makeover

**Datum:** 2026-02-19  
**Ledare:** Maria Lindqvist (VD-Agent)  
**Mål:** Omvandla portalen från "tight och plottrig" till "luftig och inspirerande"

---

## 🎯 Mål för sprinten

### Primära mål
1. **Radikal förenkling** - Färre element, mer whitespace
2. **Tydlig hierarki** - Användaren vet direkt vad de ska göra
3. **Lugnande design** - Minska stress för arbetssökande
4. **Modern estetik** - Inspirerad av referensbilden (dash1.png)

### Success criteria
- [ ] Dashboard har max 3 tydliga sektioner
- [ ] Alla sidor har generös whitespace (padding minst 24px-32px)
- [ ] Visuell hierarki är tydlig (rubriker → subtext → actions)
- [ ] Long-term Job Seeker Agent godkänner designen
- [ ] Ingen "plottrighet" enligt projektägaren

---

## 👥 Teamuppdrag

### Graphic Designer Agent 🎨
**Ansvar:** Skapa nytt komplett designsystem
**Leverabler:**
1. Färgpalett (definiera i Tailwind-konfig)
2. Typografiskala
3. Spacing-system
4. Komponent-bibliotek (Button, Card, Input)
5. Mockups för ny Dashboard-layout

**Deadline:** 30 minuter

---

### Fullstack Developer Agent 🚀
**Ansvar:** Refaktorera kodstruktur för att stödja ny design
**Leverabler:**
1. Dela upp Layout.tsx i mindre komponenter
2. Skapa återanvändbara UI-komponenter
3. Sätta upp designsystem-konfiguration
4. Förbereda för Graphic Designers nya komponenter

**Deadline:** 30 minuter

---n### Long-term Job Seeker Agent 👤
**Ansvar:** Användartestning och feedback
**Uppdrag:**
1. Granska Graphic Designers mockups
2. Säkerställa att designen känns lugnande (inte stressande)
3. Verifiera att nästa-steg är tydliga
4. Godkänna slutlig design

---

### Work Consultant Agent 🎯
**Ansvar:** Tillgänglighetsgranskning
**Uppdrag:**
1. Säkerställa tillräcklig kontrast
2. Verifiera att knappar är tillräckligt stora
3. Kontrollera att färger inte skapar stress
4. Godkänna tillgänglighet

---

### Developer Agent 💻
**Ansvar:** Implementering
**Uppdrag:**
1. Implementera Graphic Designers komponenter
2. Uppdatera alla sidor med ny design
3. Säkerställa att routing fungerar
4. Testa på mobil och desktop

---

## 📋 Sprint-schema

| Tid | Aktivitet | Ansvarig |
|-----|-----------|----------|
| 0-10 min | Graphic Designer skapar färgpalett & typografi | Graphic Designer |
| 0-15 min | Fullstack Developer refaktorerar Layout.tsx | Fullstack Developer |
| 10-20 min | Graphic Designer skapar komponenter | Graphic Designer |
| 15-25 min | Fullstack Developer skapar UI-bibliotek | Fullstack Developer |
| 20-30 min | Graphic Designer skapar Dashboard-mockup | Graphic Designer |
| 30-35 min | Long-term Job Seeker & Work Consultant granskar | Test-team |
| 35-50 min | Developer implementerar ny design | Developer |
| 50-60 min | Testning & justeringar | Alla |

---

## 🎨 Designriktlinjer (från VD)

### Inspirationskällor
- Referensbild: dash1.png (H-care dashboard)
- Principer: Mycket whitespace, luftig, modern

### Förbjudet ❌
- Gradient-bakgrunder (för plottriga)
- För många färger
- Skuggor överallt
- Små, tighta element
- Text i VERSALER

### Krav ✅
- Generösa marginaler (minst 24px-32px)
- En tydlig primärfärg (violett/lila)
- Vita kort med subtila kanter
- Tydlig hierarki: Stor rubrik → beskrivning → action
- Gärna enkel illustration/ikon för att bryta av

---

## ✅ Exit-kriterier

Sprinten är klar när:
1. Graphic Designer har godkänt visuell design
2. Long-term Job Seeker känner att designen är lugnande
3. Work Consultant har godkänt tillgänglighet
4. Developer har implementerat och pushat till GitHub
5. Projektägaren (du!) är nöjd med resultatet

---

**Redo att starta sprinten?** 🚀
