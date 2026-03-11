# 🎮 Testguide - Deltagarportalen

**Server:** http://localhost:5000  
**Status:** ✅ Klar att testa!

---

## 🚀 Så här kommer du igång:

1. **Öppna webbläsaren**
2. **Gå till:** http://localhost:5000
3. **Logga in** med valfria uppgifter (demo-läge)

---

## 📋 Testa dessa funktioner:

### 1. 🎯 Onboarding (första gången)
**Vad du ska se:** En välkomst-guide med 5 steg

**Testa:**
- [ ] Klicka dig igenom alla 5 steg
- [ ] Eller klicka "Hoppa över"
- [ ] Se att du kommer till Dashboard

**För att testa igen:**
- Öppna webbläsar-konsolen (F12)
- Skriv: `localStorage.removeItem('has-seen-onboarding')`
- Ladda om sidan

---

### 2. 🎨 Dashboard - Designförbättringar
**Vad du ska se:** Vacker dashboard med animationer

**Testa:**
- [ ] Se de dekorativa blur-cirklarna i bakgrunden
- [ ] Hovra över knapparna - de ska lyfta och skala upp
- [ ] Kolla att det finns 4 statistik-kort längst ner
- [ ] Klicka på "Fortsätt med CV", "Sök jobb", "Ta testet"

---

### 3. 🔍 Jobbsökning från Arbetsförmedlingen
**Gå till:** Menyn → "Sök jobb"

**Testa:**
- [ ] Skriv "utvecklare" i sökrutan
- [ ] Vänta på att resultaten laddas (se loading-animationen)
- [ ] Kolla att du ser yrkesrekommendationer under sökrutan
- [ ] Klicka på "Programmerare" i förslagen
- [ ] Testa filtren (Distansarbete, Anställningstyp)

**Testa jobbdetaljer:**
- [ ] Klicka på "Läs mer" på ett jobb
- [ ] Klicka "Spara jobb" (hjärt-ikonen)
- [ ] Klicka "Kolla matchning" - se CV-analysen
- [ ] Stäng modalen

---

### 4. 🔔 Notifikationer & Bevakningar
**Vad du ska se:** En klocka längst ner till vänster

**Testa:**
- [ ] Klicka på klockan (🔔)
- [ ] Klicka på inställnings-ikonen (⚙️)
- [ ] Skriv "sjuksköterska" och klicka "Lägg till"
- [ ] Se att bevakningen sparas
- [ ] Klicka "Kontrollera nu" för att söka direkt

---

### 5. 🎯 CV-matchning
**Gå till:** "Sök jobb" → Klicka på ett jobb → "Kolla matchning"

**Vad du ska se:**
- Matchningspoäng (t.ex. 65%)
- Gröna taggar för matchande kompetenser
- Röda taggar för saknade kompetenser
- Rekommendationer

---

### 6. ⚡ Snabbansökan
**Gå till:** "Sök jobb" → Klicka på ett jobb → "Snabbansök"

**Testa:**
- [ ] Välj en mall (Standard, Kort & Koncis, eller Omväxling)
- [ ] Se att personligt brev genereras automatiskt
- [ ] Redigera brevet om du vill
- [ ] Klicka "Granska & skicka"
- [ ] Se sammanfattningen

---

### 7. 📊 Marknadsstatistik
**Vad du ska se:** En knapp längst ner i mitten

**Testa:**
- [ ] Klicka på "Marknadsstatistik"
- [ ] Se topp 10 mest efterfrågade kompetenser
- [ ] Kolla trendande yrken
- [ ] Se statistik per region
- [ ] Stäng modalen

---

### 8. 💗 Krisstöd
**Vad du ska se:** Ett rosa hjärta längst ner till höger

**Testa:**
- [ ] Klicka på hjärtat
- [ ] Se krisstöds-modalen
- [ ] Klicka på "Andningsövning" för att se guiden
- [ ] Stäng modalen

---

### 9. 🌿 "Lugn Läge" (Tillgänglighet)
**Gå till:** Inställningar → Tillgänglighet

**Testa:**
- [ ] Aktivera "Lugn läge"
- [ ] Se att menyn blir större
- [ ] Vänta 15 minuter (eller simulera aktivitet)
- [ ] Se paus-påminnelsen

**Tips:** För att testa paus-påminnelsen snabbare:
- Ändra `workDuration={15}` till `workDuration={1}` i `Layout.tsx` (1 minut istället för 15)

---

### 10. 📝 CV-generator
**Gå till:** Menyn → "CV-generator"

**Testa:**
- [ ] Fyll i dina uppgifter steg för steg
- [ ] Se att det sparas automatiskt
- [ ] Kolla CV-poängen
- [ ] Se förbättringsförslag

---

### 11. ❤️ Välmående
**Gå till:** Menyn → "Välmående"

**Testa:**
- [ ] Välj ett humör (emoji)
- [ ] Bocka i en daglig aktivitet
- [ ] Se att progress-baren fylls
- [ ] Läs dagens affirmation
- [ ] Skriv i dagboken (valfritt)

---

### 12. Empty States
**Testa:**
- [ ] Gå till "Jobb-tracker" (om du inte har några ansökningar)
- [ ] Se det vackra empty state-meddelandet
- [ ] Klicka på "Lägg till ansökan"

---

## 🎯 Snabb Test-checklista

Kopiera denna lista och bocka av när du testat:

```
Bas-funktioner:
□ Onboarding visas första gången
□ Dashboard har animationer
□ Meny fungerar (expandera/fälla ihop)
□ Krisstöd-knappen fungerar

Jobbsökning:
□ Sökning fungerar
□ Filter fungerar
□ Yrkesrekommendationer visas
□ Spara jobb fungerar
□ CV-matchning visar poäng
□ Snabbansökan genererar brev

Notifikationer:
□ Bevakningar kan skapas
□ Notifikationer visas
□ Markera som läst fungerar

Tillgänglighet:
□ "Lugn läge" aktiveras
□ Paus-påminnelse visas
□ Hög kontrast fungerar
□ Större text fungerar

Design:
□ Loading states är snygga
□ Empty states är hjälpsamma
□ Toast-notifikationer visas
□ Alla animationer fungerar
```

---

## 🔧 Om något inte fungerar:

**Problem:** Sidan laddas inte
**Lösning:** Prova att ladda om (Ctrl+F5)

**Problem:** Onboarding visas inte
**Lösning:** Öppna konsolen (F12) och kör:
```javascript
localStorage.removeItem('has-seen-onboarding')
location.reload()
```

**Problem:** Jobbsökning ger inga resultat
**Lösning:** Kontrollera att du har internet (API:et behöver nätverk)

---

## 📝 Ge feedback:

När du testat klart, berätta:
1. Vilken funktion gillade du mest?
2. Vad var förvirrande?
3. Vad saknar du?
4. Hur kändes designen?

---

**Lycka till med testningen!** 🎉

Om något är oklart, fråga mig!
