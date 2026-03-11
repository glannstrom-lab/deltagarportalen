# Teamrådgivning: AI-lösningar för Career-sidan

## Bakgrund
Karriärcoachen har nu en fungerande AI-lösning som:
- Uppskattar löner för valda yrken
- Uppskattar antal lediga jobb nationellt  
- Skapar skräddarsydda karriärvägar
- Analyserar marknaden

## Fråga till teamet

Vi har 4 andra komponenter på Career-sidan som skulle kunna dra nytta av AI:

### 1. Löneinsikter (SalaryInsights)
**Nuvarande:** Visar lönestatistik från AF API (som inte fungerar)
**Förslag:** Låt AI uppskatta löner baserat på yrke, region, erfarenhet

**Användarflöde:**
1. Användare väljer yrke
2. AI uppskattar medianlön, percentiler (25%, 75%)
3. AI analyserar lönetrender och ger råd
4. AI jämför löner i olika regioner

**Frågor:**
- Ska vi spara lönejämförelser i databasen?
- Ska AI också föreslå hur man kan öka sin lön?

---

### 2. Kompetensutveckling (SkillsDevelopment)  
**Nuvarande:** Visar kompetenser från AF API (begränsat)
**Förslag:** Låt AI analysera vilka kompetenser som behövs

**Användarflöde:**
1. Användare väljer målyrke
2. AI listar viktiga kompetenser (hårda & mjuka)
3. AI skapar en prioriterad lista baserat på efterfrågan
4. AI föreslår hur man kan lära sig varje kompetens

**Frågor:**
- Ska användare kunna markera kompetenser de vill utveckla?
- Ska vi ha "kompetensgap-analys" - skillnaden mellan nu och mål?

---

### 3. Utbildning (EducationOverview)
**Nuvarande:** Söker utbildningar från AF API
**Förslag:** Låt AI ge utbildningsråd

**Användarflöde:**
1. Användare väljer yrke
2. AI föreslår relevanta utbildningar (YH, universitet, etc.)
3. AI jämför alternativ och ger råd
4. AI uppskattar tidsåtgång och kostnad

**Frågor:**
- Ska AI prioritera utbildningar efter "bang for the buck"?
- Ska vi koppla till specifika utbildningsanordnare?

---

### 4. Nätverkande (NetworkingGuide)
**Nuvarande:** Statiska mallar och tips
**Förslag:** Låt AI generera personliga nätverksstrategier

**Användarflöde:**
1. Användare anger nuvarande och målyrke
2. AI föreslår vilka som är viktiga att nätverka med
3. AI skapar personliga meddelandemallar
4. AI ger strategi för LinkedIn och branschträffar

**Frågor:**
- Ska AI skriva färdiga LinkedIn-inbjudningar?
- Ska vi ha "informationsintervju-guide"?

---

## Teknisk överväganden

### Förslag på AI-arkitektur:
```
/api/ai/salary      - för löneinsikter
/api/ai/skills      - för kompetensanalys  
/api/ai/education   - för utbildningsråd
/api/ai/networking  - för nätverksstrategier
```

Eller en gemensam:
```
/api/ai/career      - befintlig för karriärvägar
/api/ai/career-data - ny för all annan data
```

### Kostnader:
- OpenRouter API kostar per anrop
- Ska vi cacha AI-svar i Supabase?
- Ska vi begränsa antal AI-anrop per användare?

## Diskussionsfrågor

1. **Prioritet:** Vilken komponent är viktigast att AI-förbättra först?

2. **Omfattning:** Ska vi göra en liten förbättring eller full AI-integration?

3. **Data:** Ska vi fortsätta försöka använda AF API som fallback?

4. **UX:** Ska vi markera tydligt vad som är "AI-uppskattat" vs "verklig data"?

5. **Scope:** Ska vi fokusera på ett yrke i taget eller låta AI analysera omställningar?

---

Vänligen ge era synpunkter så jag kan implementera lösningen! 🚀
