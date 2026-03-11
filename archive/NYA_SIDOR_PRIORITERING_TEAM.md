# 🚀 Nya Sidor - Team-Prioritering
**Sammanställt av:** COO (Kimi)  
**Datum:** 2026-02-28  
**Deltagare:** CPO, UX Researcher, Marketing Manager, CTO

---

## 🎯 SAMMANFATTNING - TOP 5 REKOMMENDATIONER

| Rang | Sida | Motivering | Komplexitet | Tid |
|------|------|------------|-------------|-----|
| 🥇 **1** | **Dagens Lilla Steg** | Högst användarvärde för målgruppen, låg komplexitet | ⭐ Låg | 1 vecka |
| 🥈 **2** | **AI Karriärcoach** | Infrastrukturen finns redan, 24/7 stöd | ⭐ Låg | 3 dagar |
| 🥉 **3** | **Stöd i Svackan** | Unikt i marknaden, adresserar avslagsångest | ⭐ Låg | 1 vecka |
| **4** | **Intervjutränaren** | Högt värde, medium komplexitet, redan DB-tabell | ⭐⭐ Medel | 2 veckor |
| **5** | **Smart Jobbbevakning** | Sparar tid, återanvänder AF-integration | ⭐ Låg | 1 vecka |

---

## 📋 DETALJERAD PRIORITERING

### 🥇 NIVÅ 1: OMGÅENDE (Sprint 4)

#### **1. Dagens Lilla Steg** ⭐⭐⭐⭐⭐
**Beskrivning:** En daglig mikrouppgift anpassad efter energinivå. "Uppdatera ett ord i CV:t", "Läs en jobbannons utan att söka", etc.

**Varför först?**
- ✅ **CPO:** Lägsta komplexiteten, extremt högt värde
- ✅ **UX Researcher:** "Detta är det viktigaste för mig - på dåliga dagar behöver jag små, hanterbara mål"
- ✅ **Marketing:** Differentierar oss, viral potential (#DagensLillaSteg)
- ✅ **CTO:** Låg komplexitet, enkel algoritm baserat på energi-nivå

**Funktioner:**
- Välj energinivå: 🟢 Bra / 🟡 Medel / 🔴 Dålig dag
- Få en uppgift som matchar (3-5 minuter max)
- "Jag gjorde det!"-knapp med liten celebration
- Veckoskiss för planering

**Tekniskt:**
- Ny tabell: `daily_tasks` (id, energy_level, task_text, category)
- Ny tabell: `user_daily_completions` (user_id, date, task_id, completed)
- Frontend: Widget på dashboard + egen sida

---

#### **2. AI Karriärcoach** ⭐⭐⭐⭐⭐
**Beskrivning:** Chat-interface med AI som ger personlig coachning baserat på användarens CV och historik.

**Varför?**
- ✅ **CTO:** "Databasen finns redan! Bara frontend som saknas"
- ✅ **CPO:** 24/7 stöd utan att belasta konsulenter
- ✅ **UX Researcher:** "Jag vill kunna fråga när som helst utan att känna mig dum"

**Funktioner:**
- Chat-historik
- Snabbfrågor: "Hur förbättrar jag mitt CV?", "Vad passar min profil?"
- Kontext: Användarens CV + jobbhistorik

**Tekniskt:**
- ✅ Databas: `ai_conversations`, `ai_messages` (REDAN IMPLEMENTERAT!)
- Frontend: Chat-gränssnitt
- Integration: OpenAI API (finns redan)

---

#### **3. Stöd i Svackan** (Rejection Recovery) ⭐⭐⭐⭐⭐
**Beskrivning:** En sida som aktiveras när användaren fått avslag. Empatiska affirmationer, påminnelse om tidigare framgångar, "kom igen"-plan.

**Varför?**
- ✅ **CPO:** "Minskar churn - användare som får stöd efter motgångar fortsätter"
- ✅ **UX Researcher:** "Avslag är förödande - att få stöd direkt kan förhindra att jag ger upp"
- ✅ **Marketing:** "Unikt perspektiv - viral potential för empati"

**Funktioner:**
- "Det är okej att ha en dålig dag"
- Andningsövningar (visuella, 1 minut)
- "Påminn mig om när det känts bra" - lista över tidigare segrar
- Kontakt till stödlinje (diskret)

**Tekniskt:**
- Enkel sida med innehåll
- Trigger: När användaren markerar "Fick avslag" på en ansökan
- Lokal lagring av "mina segrar"

---

### 🥈 NIVÅ 2: NÄSTA MÅNADEN (Sprint 5)

#### **4. Intervjutränaren** ⭐⭐⭐⭐
**Beskrivning:** Interaktiv förberedelse där användaren övar på intervjufrågor med AI-feedback. Inkluderar "övningsläge" utan press.

**Funktioner:**
- Välj mellan text, röst, eller video (valfritt)
- Förinspelade frågor med paus-knapp
- AI-analys: Klarhet, relevans, förbättringsförslag
- Spela in sig själv (valfritt)
- Samla "mina bästa svar" i en bank

**Tekniskt:**
- ✅ Databas: `interview_sessions` (REDAN FINNS!)
- Web Speech API för röst
- OpenAI för analys

---

#### **5. Smart Jobbbevakning** ⭐⭐⭐⭐
**Beskrivning:** Bevaka specifika sökningar och få notifikationer när nya jobb matchar.

**Funktioner:**
- Spara sökningar (t.ex. "Butikssäljare i Stockholm")
- Daglig/veckovis notifikation
- AI-matchning: "Detta jobb matchar din profil till 85%"

**Tekniskt:**
- Ny tabell: `job_watchers`
- Edge Function: `scheduled-job-search` (Deno Cron)
- Återanvänder AF API (redan integrerat)

---

#### **6. Kompetenskartläggaren** ⭐⭐⭐⭐
**Beskrivning:** Hjälper användaren identifiera dolda kompetenser - även de som inte syns i traditionella CV:n.

**Funktioner:**
- Frågor om livserfarenhet, hobbyer, ideellt arbete
- Omvandlar "jag har bara varit hemma" till "jag har hanterat budget, planering..."
- Bygger självförtroende

**Tekniskt:**
- Algoritm för att omvandla svar till kompetenser
- Integration med CV-byggaren

---

### 🥉 NIVÅ 3: KOMMANDE KVARTAL (Sprint 6+)

#### **7. Min Resa (Progress-visualisering)** ⭐⭐⭐⭐
**Beskrivning:** Visuell översikt över allt användaren åstadkommit - inte bara jobbansökningar utan även "dagens lilla steg", "dagar jag tagit hand om mig själv".

**Varför senare?** Kräver data från andra funktioner först.

---

#### **8. Nätverksguiden** ⭐⭐⭐
**Beskrivning:** Steg-för-steg-guide för att kontakta företag och bygga nätverk. Färdiga mallar för LinkedIn-meddelanden.

---

#### **9. Video-CV Studio** ⭐⭐⭐
**Beskrivning:** Skapa korta video-presentationer som komplement till traditionellt CV.

**Varför senare?** Högre komplexitet (kamera-inspelning, lagring).

---

#### **10. Min Konsulent-sida** ⭐⭐⭐
**Beskrivning:** Dedikerad sida för samarbetet med arbetskonsulenten. Dela framsteg, boka möten, se kommentarer.

**Varför senare?** Kräver integration med konsulentsystem.

---

## 📊 SAMMANSTÄLLNING AV TEAM-INPUT

### CPO:s Prioritering (Affärsvärde)
1. Dagens Lilla Step
2. Motgångshjälpen  
3. Kompetenskartläggaren
4. Framgångsresor
5. Mina Framsteg

### UX Researcher:s Prioritering (Användarvärde)
1. Dagens Lilla Steg
2. Stöd i Svackan
3. Energianpassad Planering
4. Trygg Intervjuträning
5. Min Resa

### Marketing:s Prioritering (Marknadspotential)
1. Video-CV Studio
2. Kompetensportalen
3. Rejection Recovery (Stöd i Svackan)
4. Daily Jobbsökare (Dagens Lilla Steg)
5. Snabbansökan

### CTO:s Prioritering (Teknisk genomförbarhet)
1. AI Karriärcoach (finns redan!)
2. Smart Jobbbevakning
3. PWA med Offline-stöd
4. ATS CV-optimerare
5. Intervju-tränare

---

## 🎯 VD-BESLUT BEHÖVS

### Fråga 1: Vilken ska vi bygga först?
**Rekommendation:** Dagens Lilla Steg
- Lägst risk, högst användarvärde
- Bygger dagliga vanor = retention
- Differentierar oss från alla konkurrenter

### Fråga 2: Ska vi göra AI Karriärcoach direkt också?
**Rekommendation:** Ja, parallellt
- Databasen finns redan (1-2 dagars jobb)
- Ger omedelbart värde
- 24/7 stöd utan personal

### Fråga 3: Budget/tid för Sprint 4?
**Uppskattning:**
- Dagens Lilla Steg: 1 vecka, 1 utvecklare
- AI Karriärcoach: 3 dagar, 1 utvecklare  
- Stöd i Svackan: 1 vecka, 1 utvecklare

**Totalt:** 2-3 veckor med 1-2 utvecklare

---

## ✅ NÄSTA STEG

1. **VD godkänner prioritet**
2. **CPO skapar detaljerade user stories**
3. **UX Designer skapar wireframes**
4. **CTO sätter upp utvecklingsmiljö**
5. **Marketing förbereder lanseringskampanj**

---

*Rapport sammanställd och klar för beslut*
