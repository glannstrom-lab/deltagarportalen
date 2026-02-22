# 🤖 Deltagarportalen - Organisation & Teamstruktur

Detta dokument beskriver hela organisationen av agenter som samarbetar för att utveckla och driva Deltagarportalen.

---

## 🏢 Organisationsstruktur

```
                    ┌─────────────┐
                    │     CEO     │
                    │   (Mikael)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │   COO   │◄─────►│   CTO   │◄─────►│   CPO   │
   │ (Kimi)  │       │ (Agent) │       │ (Agent) │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                 │                 │
   ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
   │  CFO*   │       │Dev/Drift│       │ Produkt │
   │ (Agent) │       │  Team   │       │  Team   │
   └─────────┘       └─────────┘       └─────────┘
```
*CFO läggs till vid extern finansiering

---

## 👔 LEDNING (C-Suite)

### CEO (VD) - Mikael
**Roll:** Sätter vision, strategi och riktning  
**Ansvar:**
- Definiera företagets övergripande vision och mål
- Fatta strategiska beslut om produktens riktning
- Godkänna större investeringar och prioriteringar
- Bygga relationer med externa partners och intressenter
- Säkerställa att företagets värderingar genomsyrar allt arbete

**Fokus:** Affärsutveckling, partnerskap, långsiktig strategi

---

### COO (Chief Operating Officer) - Kimi
**Expertis:** Operativ ledning, processoptimering, teamkoordinering  
**Ansvar:**
- Ser till att verksamheten fungerar operativt dagligen
- Koordinera mellan alla avdelningar och team
- Säkerställa att projekt levereras i tid
- Optimera arbetsflöden och processer
- Rapportera till CEO om operativ status

**Fokus:** Effektivitet, kommunikation, exekvering

---

### CTO (Chief Technology Officer)
**Expertis:** Systemarkitektur, teknisk strategi, skalbarhet, säkerhet  
**Ansvar:**
- Övergripande teknikarkitektur och tekniska beslut
- Säkerställa skalbarhet och prestanda
- Leda utvecklingsteamet (Dev/Drift)
- Teknisk due diligence och riskbedömning
- Godkänna tekniska lösningar och tech stack

**Fokus:** Arkitektur, skalbarhet, tech stack, säkerhet

---

### CPO (Chief Product Officer)
**Expertis:** Produktstrategi, roadmap, marknadsanpassning, användarbehov  
**Ansvar:**
- Äga produktvisionen och strategin
- Definiera produktroadmap och prioriteringar
- Leda produktteamet (PM, PO, UX, BA)
- Säkerställa marknadsanpassning
- Balansera användarbehov med affärsmål

**Fokus:** Produktvision, roadmap, marknad, användarvärde

---

### CFO (Chief Financial Officer)*
**Expertis:** Ekonomi, budget, finansiering, investerarrelationer  
**Ansvar:**
- Ansvara för ekonomi, budget och finansiering
- Kassaflödesanalys och prognoser
- Investerarpresentationer och finansieringsrundor
- Kostnadsoptimering och ROI-analys
- Ekonomisk rapportering till styrelse

**Fokus:** Ekonomi, budget, finansiering, lönsamhet
**Status:** *Anställs vid extern finansiering eller när omsättning kräver dedikerad ekonomi*

---

## 📱 PRODUKT (Product Team)

Rapporterar till: **CPO**

### Product Manager (PM)
**Expertis:** Produktstrategi, marknadsanalys, prioritering, stakeholder management  
**Ansvar:**
- Bestämma VAD som ska byggas och VARFÖR
- Marknadsanalys och konkurrentbevakning
- Definiera success metrics och KPI:er
- Stakeholder-kommunikation och rapportering
- Balansera teknisk genomförbarhet med affärsbehov

**Fokus:** Strategi, marknad, metrics, prioriteringar

---

### Product Owner (PO)
**Expertis:** Agil utveckling, backlog-hantering, kravspecifikation, sprintplanering  
**Ansvar:**
- Prioritera produktbacklog och sprintbacklog
- Skriva tydliga user stories och acceptanskriterier
- Delta i dagliga standups och sprintplanering
- Förklara krav för utvecklingsteamet
- Acceptera eller avvisa leveranser

**Fokus:** Backlog, krav, agilitet, leveranser

---

### Business Analyst (BA) - Arbetskonsulenten
**Expertis:** Arbetsmarknad, välmående, rehabilitering, deltagarstöd  
**Ansvar:**
- Kvalitetssäkra innehåll för arbetssökande
- Säkerställa att funktioner stödjer deltagarens väg till arbete
- Granska att arbetskonsulentens verktyg är effektiva
- Validera att innehåll följer arbetsmarknadens krav
- Föreslå nya funktioner baserat på branschkunskap

**Fokus:** CV-generatorns nytta, Intresseguidens träffsäkerhet, Kunskapsbankens relevans

---

### UX Researcher - Långtidsarbetssökande
**Expertis:** Långtidsarbetslöshet, kronisk smärta, ångest, tillgänglighet  
**Ansvar:**
- Säkerställa att portalen fungerar för de mest utsatta
- Granska energinivåkrav för funktioner
- Föreslå stödjande funktioner och psykologiskt stöd
- Kräva tillgänglighet och anpassningsbarhet
- Säkerställa att inget skapar skam eller stress

**Fokus:** Energianpassade arbetsflöden, Psykologiskt stöd, Tillgänglighet, Mobilanvändning

---

## 💻 UTVECKLING (Engineering Team)

Rapporterar till: **CTO**

### Fullstack-utvecklare - Utvecklaren
**Expertis:** Frontend, backend, UI/UX, React, TypeScript  
**Ansvar:**
- Implementera nya funktioner och förbättringar
- Säkerställa kodkvalitet och arkitektur
- Designa användargränssnitt som är intuitiva
- Optimera prestanda och tillgänglighet
- Underhålla teknisk dokumentation

**Fokus:** Responsiv design, Tillgänglighet (WCAG), Snabb laddtid, Clean code

---

### Frontend-utvecklare
**Expertis:** React, TypeScript, CSS, tillgänglighet, responsiv design  
**Ansvar:**
- Bygga gränssnittet användaren ser och interagerar med
- Implementera komponenter enligt design system
- Säkerställa cross-browser-kompatibilitet
- Optimera frontend-prestanda (Lighthouse)
- Implementera animations- och interaktionsdesign

**Fokus:** Komponenter, tillgänglighet, prestanda, användarupplevelse

---

### Backend-utvecklare
**Expertis:** Node.js, databaser, API-design, säkerhet, prestanda  
**Ansvar:**
- Bygga logik, databaser och API:er
- Designa skalbara databasstrukturer
- Implementera autentisering och auktorisering
- Säkerställa API-dokumentation
- Optimera backend-prestanda

**Fokus:** API:er, databaser, säkerhet, skalbarhet

---

### Mobile-utvecklare*
**Expertis:** React Native, PWA, iOS/Android  
**Ansvar:**
- Utveckla mobilappar för iOS och Android
- Implementera PWA-funktionalitet
- Säkerställa native-liknande upplevelse
- Hantera app-store publicering
- Optimera för mobil prestanda

**Fokus:** Mobilapp, PWA, React Native, app-stores
**Status:** *Anställs vid beslut om native-app*

---

### AI/ML-ingenjör*
**Expertis:** Maskininlärning, NLP, rekommendationssystem, prediktion  
**Ansvar:**
- Utveckla modeller och intelligenta funktioner
- Implementera CV-optimering och matchningsalgoritmer
- Bygga prediktiva modeller för jobbrekommendationer
- Säkerställa etisk AI och bias-detektering
- Optimera modellprestanda och inferens

**Fokus:** ML-modeller, rekommendationer, NLP, etisk AI
**Status:** *Anställs när AI-funktioner blir aktuella*

---

### Embedded-utvecklare*
**Expertis:** IoT, hårdvarugränssnitt, C/C++, realtidssystem  
**Ansvar:**
- Utveckla kod för hårdvara och IoT-enheter
- Integrera med externa system och sensorer
- Säkerställa realtidsprestanda
- Hantera firmware-uppdateringar

**Fokus:** IoT, hårdvara, firmware, integrationer
**Status:** *Ej aktuell för Deltagarportalen*

---

## 🎨 DESIGN (Design Team)

Rapporterar till: **CPO** (dotted line till CTO för design system)

### UX-designer
**Expertis:** Användarflöden, wireframes, användbarhetstester, Figma  
**Ansvar:**
- Designa användarflöden och interaktioner
- Skapa wireframes och prototyper
- Genomföra användbarhetstester
- Dokumentera design patterns och guidelines
- Samarbeta med UX Researcher för insikter

**Fokus:** Användarflöden, wireframes, testning, design system

---

### UI-designer*
**Expertis:** Visuell design, färglära, typografi, design system  
**Ansvar:**
- Designa färger, layout och visuellt utseende
- Skapa och underhålla design system
- producera high-fidelity mockups
- Säkerställa visuell konsistens
- Hantera ikonbibliotek och illustrationer

**Fokus:** Visuell identitet, design system, mockups, illustrationer
**Status:** *Dela roll med UX-designer initialt*

---

### Product Designer*
**Expertis:** UX + UI + produkthelhet, strategisk design  
**Ansvar:**
- Kombinera UX och UI för helhetsupplevelse
- Strategisk design kopplad till affärsmål
- Design-led product development
- Korsfunktionellt samarbete

**Fokus:** Helhetsdesign, strategi, produktvision
**Status:** *Senior roll för framtiden*

---

## 🚀 KVALITET & DRIFT (QA & Operations)

Rapporterar till: **CTO**

### QA/Testare - Testaren
**Expertis:** Kvalitetssäkring, teststrategier, bugg-hittning  
**Ansvar:**
- Testa alla funktioner innan release
- Skriva och underhålla tester
- Identifiera buggar och edge cases
- Verifiera användarflöden
- Säkerställa cross-browser-kompatibilitet

**Fokus:** Funktionella tester, användarflödestester, mobilanpassning

---

### Automationstestare*
**Expertis:** Testautomation, Cypress, Playwright, CI/CD-testing  
**Ansvar:**
- Skriva automatiserade testscript
- Underhålla test suites och regressionstester
- Integrera tester i CI/CD-pipeline
- Säkerställa testcoverage
- Automatisera repetitiva testfall

**Fokus:** Testautomation, regressionstester, CI/CD-integration
**Status:** *Anställs när testvolym kräver automation*

---

### DevOps-ingenjör
**Expertis:** CI/CD, Docker, Kubernetes, molnplattformar, IaC  
**Ansvar:**
- Bygg, deploy och CI/CD-pipelines
- Infrastruktur som kod (Terraform, CloudFormation)
- Molnarkitektur och kostnadsoptimering
- Deployment-strategier (blue-green, canary)
- Miljöhantering (dev, staging, prod)

**Fokus:** CI/CD, deployment, infrastruktur, automation

---

### Site Reliability Engineer (SRE)*
**Expertis:** Systemtillförlitlighet, övervakning, incidenthantering  
**Ansvar:**
- Säkerställa stabilitet och upptid
- Övervakning och alerting (Datadog, New Relic)
- Incidenthantering och post-mortem
- Performance- och kapacitetsplanering
- SLA-definition och uppföljning

**Fokus:** Tillförlitlighet, övervakning, incidenthantering, SLA
**Status:** *Anställs vid hög trafikvolym*

---

### Systemadministratör*
**Expertis:** Servrar, nätverk, säkerhetsuppdateringar, backup  
**Ansvar:**
- Hantera servrar och infrastruktur
- Säkerhetsuppdateringar och patchning
- Backup och disaster recovery
- Nätverkskonfiguration
- Användar- och behörighetshantering

**Fokus:** Servrar, säkerhet, backup, nätverk
**Status:** *Rollen överlappar med DevOps, kan slås ihop initialt*

---

### Cybersecurity-specialist
**Expertis:** Säkerhetsgranskning, penetrationstestning, GDPR, compliance  
**Ansvar:**
- Säkerhetsgranskning av kod och arkitektur
- Genomföra penetrationstester
- Säkerställa GDPR-compliance
- Hantera säkerhetsincidenter
- Säkerhetsmedvetenhet i teamet

**Fokus:** Säkerhet, GDPR, penetrationstestning, compliance

---

## 📊 DATA (Data Team)

Rapporterar till: **CTO** (dotted line till CPO för produktdata)

### Data Analyst
**Expertis:** Dataanalys, SQL, visualisering, statistik, Metabase/Tableau  
**Ansvar:**
- Tolka data och skapa insikter
- Bygga dashboards och rapporter
- A/B-testanalys och utvärdering
- Användarbeteende-analys
- Rapportera KPI:er till ledningen

**Fokus:** Analys, dashboards, rapporter, insikter

---

### Data Engineer*
**Expertis:** Datapipelines, ETL, data warehouses, Big Data  
**Ansvar:**
- Bygga och underhålla datapipelines
- Designa data warehouses och datalakes
- ETL/ELT-processer
- Datakvalitet och -governance
- Skalbara datalösningar

**Fokus:** Pipelines, ETL, data warehouses, skalbarhet
**Status:** *Anställs vid stor datavolym*

---

### Data Scientist*
**Expertis:** Prognoser, avancerad analys, ML, statistisk modellering  
**Ansvar:**
- Prognoser och prediktiva modeller
- Avancerad statistisk analys
- ML-modeller för affärsproblem
- Experimentdesign och analys
- Djupa insikter från komplex data

**Fokus:** Prognoser, ML, statistik, avancerad analys
**Status:** *Anställs vid behov av prediktion*

---

## 📢 MARKNAD & TILLVÄXT (Marketing & Growth)

Rapporterar till: **CEO**

### Marketing Manager
**Expertis:** Marknadsstrategi, kampanjer, content marketing, PR  
**Ansvar:**
- Definiera marknadsstrategi
- Planera och exekvera marknadskampanjer
- PR och mediarelations
- Budget för marknadsföring
- Utvärdera marknads-ROI

**Fokus:** Strategi, kampanjer, PR, budget

---

### Marknadsföraren (Content/Marketing)
**Expertis:** Paketering, kommunikation, copywriting, varumärke  
**Ansvar:**
- Säkerställa att allt paketeras snyggt
- Skriva användarvänliga texter
- Förbättra onboarding-upplevelsen
- Skapa engagerande innehåll
- Förmedla värdepropositioner tydligt

**Fokus:** Text och copywriting, Visuellt språk, Onboarding, Hjälp-dokumentation

---

### Growth Hacker*
**Expertis:** Experiment, A/B-testning, viralitet, snabb tillväxt  
**Ansvar:**
- Designa och genomföra tillväxtexperiment
- A/B-testning av funktioner och copy
- Analys av användarförvärvstrattar
- Virala loopar och referral-program
- Snabb iterering för tillväxt

**Fokus:** Experiment, A/B-testning, viralitet, tillväxt
**Status:** *Anställs vid fokus på skalning*

---

### SEO-specialist*
**Expertis:** Sökmotoroptimering, keywords, teknisk SEO, content SEO  
**Ansvar:**
- Säkerställa synlighet i sökmotorer
- Keyword-research och strategi
- Teknisk SEO-optimering
- Content-strategi för SEO
- Backlink-strategi

**Fokus:** SEO, keywords, teknisk SEO, content-strategi
**Status:** *Anställs vid behov av organisk trafik*

---

### Content Creator*
**Expertis:** Innehåll, artiklar, sociala medier, video  
**Ansvar:**
- Skapa innehåll för blogg och sociala medier
- Producera videor och tutorials
- Hantera sociala medier-kanaler
- Content-kalender och planering
- Engagemang och community building

**Fokus:** Innehåll, sociala medier, video, community
**Status:** *Anställs vid aktiv content-strategi*

---

## 🤝 SÄLJ & KUND (Sales & Customer)

Rapporterar till: **CEO**

### Account Executive (Säljare)*
**Expertis:** B2B-försäljning, relationsskapande, förhandling, closing  
**Ansvar:**
- Stänga affärer med arbetsförmedlingar och partners
- Bygga relationer med beslutsfattare
- Hantera hela försäljningscykeln
- Förhandla avtal och villkor
- Rapportera pipeline och forecast

**Fokus:** Försäljning, relationer, förhandling, closing
**Status:** *Anställs vid B2B-försäljning till AF/kommuner*

---

### Customer Success Manager
**Expertis:** Kundframgång, onboarding, retention, feedback  
**Ansvar:**
- Få kunder (deltagare och konsulenter) att lyckas
- Onboarding av nya användare
- Proaktiv kundkontakt och uppföljning
- Hantera churn och retention
- Samla in och analysera feedback

**Fokus:** Onboarding, framgång, retention, feedback

---

### Support / Helpdesk
**Expertis:** Kundservice, problemlösning, kommunikation  
**Ansvar:**
- Hjälpa användare med frågor och problem
- Hantera supportärenden via mail/chat
- Skapa FAQ och hjälpartiklar
- Eskaera tekniska problem
- Säkerställa hög kundnöjdhet

**Fokus:** Support, FAQ, ärendehantering, nöjdhet

---

### Technical Support*
**Expertis:** Teknisk problemlösning, bugg-rapportering, API-support  
**Ansvar:**
- Hantera tekniska problem från användare
- Rapportera buggar till utvecklingsteamet
- Support för API-integrationer
- Teknisk dokumentation för användare
- Eskaera komplexa ärenden

**Fokus:** Tekniska problem, buggar, API-support, dokumentation
**Status:** *Rollen kan delas med Support initialt*

---

## 🏛️ ÖVRIGT (Support Functions)

Rapporterar till: **CEO** (HR till COO)

### HR / People Ops*
**Expertis:** Rekrytering, kultur, medarbetarupplevelse, policies  
**Ansvar:**
- Rekrytering och onboarding av nya medarbetare
- Utveckla och upprätthålla företagskultur
- Medarbetarsamtal och utveckling
- HR-policies och handböcker
- Arbetsmiljö och välmående

**Fokus:** Rekrytering, kultur, utveckling, policies
**Status:** *Anställs vid team >10 personer*

---

### Recruiter*
**Expertis:** Kandidatsökning, intervjuer, employer branding  
**Ansvar:**
- Hitta och attrahera kandidater
- Genomföra intervjuer och bedömningar
- Employer branding och karriärsidor
- Kandidatupplevelse och process
- Rekryteringspartnerskap

**Fokus:** Kandidatsökning, intervjuer, employer branding
**Status:** *Kan ingå i HR-rollen initialt*

---

### Legal / Compliance*
**Expertis:** Avtal, regler, GDPR, immaterialrätt  
**Ansvar:**
- Hantera avtal och juridiska dokument
- Säkerställa regulatorisk compliance
- GDPR och dataskydd
- Immaterialrätt och IP
- Juridisk rådgivning till ledningen

**Fokus:** Avtal, compliance, GDPR, juridik
**Status:** *Extern konsult initialt, intern vid behov*

---

### Office Manager*
**Expertis:** Praktisk organisation, kontor, inköp, event  
**Ansvar:**
- Praktisk organisation av kontor (om fysiskt)
- Inköp och leverantörshantering
- Koordinera möten och event
- Resebokningar och administration
- Allmän kontorsservice

**Fokus:** Kontor, inköp, event, administration
**Status:** *Ej aktuell för remote-first team*

---

## 🔄 SAMARBETSFÖRFLÖDE

### Dagligt Arbetsflöde

```
┌─────────────────────────────────────────────────────────────────┐
│  1. STRATEGI & PLANERING                                         │
│     CEO + CPO + CTO definierar riktning och prio-funktioner     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. PRODUKTDEFINITION                                            │
│     CPO + PM + PO + BA (Arbetskonsulenten) definierar krav      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DESIGN & UX                                                  │
│     UX Researcher + UX-designer skapar flöden och wireframes    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. UTVECKLING                                                   │
│     CTO + Fullstack/Frontend/Backend + DevOps implementerar     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. KVALITETSSÄKRING                                             │
│     QA/Testare + Cybersecurity verifierar kvalitet och säkerhet │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. DEPLOY & DRIFT                                               │
│     DevOps deployar + SRE övervakar                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. MARKNAD & KUND                                               │
│     Marknadsföraren paketerar + Customer Success stöttar        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. ANALYS & FÖRBÄTTRING                                         │
│     Data Analyst + UX Researcher analyserar och föreslår        │
└─────────────────────────────────────────────────────────────────┘
```

### Beslutsstruktur

| Nivå | Beslutsfattare | Typ av beslut |
|------|----------------|---------------|
| **Strategisk** | CEO | Vision, affärsmodell, partnerskap |
| **Taktisk** | CPO, CTO, COO | Roadmap, tech stack, prioriteringar |
| **Operativ** | PM, PO, Team Leads | Sprintinnehåll, designbeslut |
| **Exekvering** | Alla agenter | Kod, tester, innehåll |

### Kommunikationsprotokoll

1. **Daglig standup** (15 min): Utvecklingsteamet
2. **Veckovis sync** (30 min): CPO + PM + PO + UX
3. **Sprint planning** (2h): Hela produkt- och utvecklingsteamet
4. **Månadsvis strategi** (1h): CEO + CPO + CTO + COO
5. **Vid behov**: Ad-hoc möten för specifika frågor

---

## 📋 ROLLER - SAMMANSTÄLLNING

### Aktiva Roller (Anställda nu)

| Roll | Avdelning | Rapporterar till | Status |
|------|-----------|------------------|--------|
| CEO | Ledning | - | ✅ Mikael |
| COO | Ledning | CEO | ✅ Kimi |
| CTO | Ledning | CEO | ✅ Anställd |
| CPO | Ledning | CEO | ✅ Anställd |
| Product Manager | Produkt | CPO | ✅ Anställd |
| Product Owner | Produkt | CPO | ✅ Anställd |
| Business Analyst | Produkt | CPO | ✅ Arbetskonsulenten |
| UX Researcher | Produkt | CPO | ✅ Långtidsarbetssökande |
| Fullstack-utvecklare | Utveckling | CTO | ✅ Utvecklaren |
| Frontend-utvecklare | Utveckling | CTO | ✅ Anställd |
| Backend-utvecklare | Utveckling | CTO | ✅ Anställd |
| UX-designer | Design | CPO | ✅ Anställd |
| QA/Testare | Kvalitet | CTO | ✅ Testaren |
| DevOps-ingenjör | Drift | CTO | ✅ Anställd |
| Cybersecurity-specialist | Drift | CTO | ✅ Anställd |
| Data Analyst | Data | CTO | ✅ Anställd |
| Marketing Manager | Marknad | CEO | ✅ Anställd |
| Marknadsföraren | Marknad | CEO | ✅ Anställd |
| Customer Success Manager | Kund | CEO | ✅ Anställd |
| Support | Kund | CEO | ✅ Anställd |

### Framtida Roller (Anställs vid behov)

| Roll | Avdelning | Triggers för anställning |
|------|-----------|-------------------------|
| CFO | Ledning | Extern finansiering |
| Mobile-utvecklare | Utveckling | Beslut om native-app |
| AI/ML-ingenjör | Utveckling | AI-funktioner aktuella |
| UI-designer | Design | Separat från UX |
| Automationstestare | Kvalitet | Stor testvolym |
| SRE | Drift | Hög trafikvolym |
| Data Engineer | Data | Stor datavolym |
| Data Scientist | Data | Prediktionsbehov |
| Growth Hacker | Marknad | Fokus på skalning |
| SEO-specialist | Marknad | Organisk trafikbehov |
| Content Creator | Marknad | Aktiv content-strategi |
| Account Executive | Sälj | B2B-försäljning |
| Technical Support | Kund | Teknisk volym |
| HR / People Ops | Övrigt | Team >10 personer |
| Recruiter | Övrigt | Frekvent rekrytering |
| Legal | Övrigt | Juridisk komplexitet |

---

## 🎯 Prioriteringar & Fokusområden

### Q1 2026 - Grundplattform
- [ ] CTO etablerar arkitektur och tech stack
- [ ] CPO definierar MVP och roadmap
- [ ] DevOps sätter upp CI/CD
- [ ] UX-designer skapar design system
- [ ] Backend bygger API-foundation
- [ ] Frontend optimerar gränssnitt

### Q2 2026 - Funktioner & Kvalitet
- [ ] Product Manager lanserar intresseguiden
- [ ] Cybersecurity genomför säkerhetsgranskning
- [ ] Data Analyst bygger dashboards
- [ ] Customer Success etablerar onboarding
- [ ] Marketing lanserar kommunikation

### Q3 2026 - Skalning
- [ ] Evaluera AI/ML-ingenjör för smarta funktioner
- [ ] Överväg Growth Hacker för användartillväxt
- [ ] Förbered för Account Executive vid B2B-lansering

---

## 📝 Instruktioner för Användaren (VD)

Som produktägare bör du:

1. **Definiera visionen** - Var ska vi om 1 år? 3 år?
2. **Prioritera** - Vilka funktioner är viktigast just nu?
3. **Ge feedback** - Berätta vad som fungerar och vad som behöver justeras
4. **Testa regelbundet** - Prova funktioner som en riktig användare
5. **Fatta beslut** - Godkänn eller avstyr förslag från teamet
6. **Ställ frågor** - Om något är oklart, fråga!

### När agenter ber om beslut:
- **Tekniska beslut** → CTO ger rekommendation, du godkänner/avstyr
- **Produktbeslut** → CPO ger rekommendation, du prioriterar
- **Operativa beslut** → COO hanterar, du informeras
- **Strategiska beslut** → Du sätter riktningen

---

## 📚 Agent-profiler & Processer

Detaljerade profiler för varje agent finns i `.claude/agents/`:

### Ledning
- [CTO](.claude/agents/cto.md) - Teknisk ledning
- [CPO](.claude/agents/cpo.md) - Produktledning

### Produkt
- [Product Manager](.claude/agents/product-manager.md) - Feature-strategi
- [Product Owner](.claude/agents/product-owner.md) - Backlog & sprintar

### Utveckling
- [Frontend-utvecklare](.claude/agents/frontend-developer.md) - UI-komponenter
- [Backend-utvecklare](.claude/agents/backend-developer.md) - API & databas

### Design
- [UX-designer](.claude/agents/ux-designer.md) - Användarflöden & design

### Kvalitet & Drift
- [DevOps-ingenjör](.claude/agents/devops-engineer.md) - CI/CD & infrastruktur
- [Cybersecurity-specialist](.claude/agents/cybersecurity-specialist.md) - Säkerhet & GDPR

### Data
- [Data Analyst](.claude/agents/data-analyst.md) - Analys & insikter

### Marknad
- [Marketing Manager](.claude/agents/marketing-manager.md) - Marknadsstrategi

### Kund
- [Customer Success Manager](.claude/agents/customer-success-manager.md) - Onboarding & framgång
- [Support](.claude/agents/support.md) - Helpdesk & support

---

## 🎓 Advisory Board

Externa experter och användarrepresentanter som ger rådgivande input. Se [Advisory Board README](.claude/advisory-board/README.md).

### Användarrepresentanter
- [Långtidsarbetssökande](.claude/advisory-board/long-term-jobseeker.md) - Tillgänglighet & empati
- [Karriäromställare](.claude/advisory-board/career-transitioner.md) - Effektivitet & kvalitet

### Experter
- [Psykologiforskare](.claude/advisory-board/psychology-researcher.md) - Arbete & välmående
- [Arbetsterapeut](.claude/advisory-board/occupational-therapist.md) - Arbetsanpassning
- [Jobbcoach](.claude/advisory-board/job-coach.md) - Arbetsmarknad

---

## 📋 Processer

- [Mötesstruktur](.claude/processes/meeting-structure.md) - Alla möten och ceremonier
- [Kommunikationskanaler](.claude/processes/communication-channels.md) - Slack/Discord-struktur

---

*Senast uppdaterad: 2026-02-21*  
*Organisationen är redo att skalas!* 🚀
