# Sprint 1: Tillgänglighet och Stöd för Utsatta Användare

**Mål:** Gör portalen användbar för långtidsarbetssökande med fysiska och psykologiska utmaningar.

**Drivs av:** Långtidsarbetssökande-agenten + hela teamet

---

## 🎯 Funktioner att Implementera

### 1. Energisparningsläge (Hög prioritet)
**Agent:** Långtidsarbetssökande  
**Beskrivning:** Ett "Lugn läge" som förenklar hela gränssnittet

**Krav:**
- Större knappar och text
- Färre alternativ synliga samtidigt
- Paus-påminnelser var 15:e minut
- Möjlighet att spara och avbryta när som helst
- Inga påminnelser om "du borde göra mer"

**Acceptanskriterier:**
- [ ] Kan aktiveras/avaktiveras i inställningar
- [ ] Alla knappar minst 48x48px
- [ ] Text minst 18px
- [ ] Max 3 alternativ synliga samtidigt
- [ ] "Spara och fortsätt senare" alltid tillgängligt

---

### 2. Stöttande Feedback-system (Hög prioritet)
**Agent:** Långtidsarbetssökande + Marknadsföraren  
**Beskrivning:** Ersätt negativa/medgörliga meddelanden med uppmuntrande

**Nuvarande:**
- ❌ "Du har inte loggat in på 5 dagar"
- ❌ "Ditt CV är ofullständigt"
- ❌ "0 ansökningar denna vecka"

**Önskat:**
- ✅ "Välkommen tillbaka! Ta det i din takt"
- ✅ "Du har kommit igång med ditt CV - bra start!"
- ✅ "Det är okej att vila idag"

**Acceptanskriterier:**
- [ ] Ingen "skam-skapande" statistik
- [ ] Alla påminnelser formulerade stöttande
- [ ] Fira små segrar ("Du loggade in idag!")
- [ ] "Det är okej att ta en paus"-meddelanden

---

### 3. Kortare Arbetsflöden (Hög prioritet)
**Agent:** Långtidsarbetssökande + Arbetskonsulenten  
**Beskrivning:** Dela upp alla uppgifter i max 15-minuterspass

**Områden:**
- CV-generator: Dela upp i fler, mindre steg
- Personligt brev: Börja med mall direkt, anpassa sen
- Intresseguide: Spara progress efter varje fråga
- Jobb-tracker: "Quick add" med minimala fält

**Acceptanskriterier:**
- [ ] Varje steg max 5 minuter att slutföra
- [ ] Progress sparas automatiskt
- [ ] "Fortsätt där du slutade" alltid synligt
- [ ] Kan avbryta och återvända utan att förlora data

---

### 4. Snabbåtkomst till Krisstöd (Hög prioritet)
**Agent:** Långtidsarbetssökande + Arbetskonsulenten  
**Beskrivning:** En synlig "Mår du dåligt?"-knapp

**Funktion:**
- Länk till 1177
- Telefonnummer till Jourhavande medmänniska
- Telefonnummer till Självmordslinjen
- Koppling till egen arbetskonsulent
- Snabb ångestdämpande övning

**Acceptanskriterier:**
- [ ] Synlig från alla sidor (men diskret)
- [ ] Ett klick bort
- [ ] Ingen förklaring krävs för att använda
- [ ] Fungerar även när man inte är inloggad

---

### 5. Mobiloptimering för Sängläge (Medel prioritet)
**Agent:** Långtidsarbetssökande + Utvecklaren  
**Beskrivning:** Funkar perfekt på mobil i horisontellt läge

**Krav:**
- Alla funktioner fungerar i mobil
- Stöd för röstinmatning
- Autofyll och smarta förslag
- Stora touch-mål (minst 48px)

**Acceptanskriterier:**
- [ ] Testat på mobil i horisontellt läge
- [ ] Röstinmatning fungerar i alla formulär
- [ ] Autofyll aktiverat för alla fält
- [ ] Inget kräver dubbelklick eller precision

---

### 6. Dagbok/Affirmationer (Medel prioritet)
**Agent:** Långtidsarbetssökande + Marknadsföraren  
**Beskrivning:** Privat utrymme för att skriva om känslor

**Funktioner:**
- Privat dagbok (ingen delning)
- Daglig affirmation/positiv påminnelse
- Humör-logg över tid
- "Vad är jag stolt över idag?"

**Acceptanskriterier:**
- [ ] Allt sparas lokalt (ingensynligt för konsulent)
- [ ] Valfritt - inget krav att skriva
- [ ] Förslag på prompts om man vill
- [ ] Kan ladda ner/export till PDF

---

## 📋 Sprint-plan

### Vecka 1: Analys och Design
- **Måndag:** Långtidsarbetssökande granskar nuvarande sida
- **Tisdag:** Arbetskonsulenten prioriterar funktioner
- **Onsdag:** Utvecklaren skissar teknisk lösning
- **Torsdag:** Marknadsföraren skriver stöttande texter
- **Fredag:** Teamet går igenom och bestämmer scope

### Vecka 2: Implementation
- **Måndag-Tisdag:** Energisparningsläge
- **Onsdag-Torsdag:** Stöttande feedback
- **Fredag:** Krisstöd-knapp

### Vecka 3: Förbättringar och Testning
- **Måndag-Tisdag:** Kortare arbetsflöden
- **Onsdag:** Mobiloptimering
- **Torsdag:** Dagbok
- **Fredag:** Testning och buggfixar

### Vecka 4: Validering
- **Måndag-Tisdag:** Testaren testar allt
- **Onsdag:** Långtidsarbetssökande godkänner
- **Torsdag:** Mikael (användaren) testar
- **Fredag:** Lansering!

---

## 🤝 Samarbete

### Långtidsarbetssökande leder med:
- Kravspecifikation för varje funktion
- Granskning av formuleringar
- Test av energinivåer
- Godkännande av stöttande texter

### Andra agenter stödjer:
- **Arbetskonsulenten:** Säkerställer professionellt stöd
- **Utvecklaren:** Bygger tillgängliga lösningar
- **Testaren:** Verifierar användbarhet
- **Marknadsföraren:** Skriver empatiska texter

---

## ✅ Success Criteria

När denna sprint är klar ska:
- [ ] En person med kronisk smärta kunna använda sidan i sängen
- [ ] Ingen text skapa skam eller stress
- [ ] Alla arbetsflöden kunna pausas och återupptas
- [ ] Krisstöd vara max 2 klick bort
- [ ] Feedback från testare vara positiv

---

**Startdatum:** Omgående  
**Måldatum:** 4 veckor  
**Prioritet:** HÖG  
