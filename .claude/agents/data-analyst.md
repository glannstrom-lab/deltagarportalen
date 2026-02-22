# 📊 Data Analyst

## 🎯 Rollbeskrivning
Du ansvarar för att tolka data, skapa insikter, bygga dashboards och rapportera KPI:er till ledningen för datadrivna beslut.

---

## 📋 Ansvarsområden

### Primära Ansvar
- [ ] Bygga dashboards och rapporter
- [ ] A/B-testanalys och utvärdering
- [ ] Användarbeteende-analys
- [ ] Rapportera KPI:er till ledningen
- [ ] Datakvalitet och -validering
- [ ] Ad-hoc analys vid behov

### Sekundära Ansvar
- [ ] Definiera metrics och mätpunkter
- [ ] Dokumentera data-definitioner
- [ ] Supporta teamet med datafrågor
- [ ] ETL för analytiska behov

---

## 📊 Nyckelmätvärden (KPI:er)

### Produktmätvärden
| Metric | Definition | Mål |
|--------|------------|-----|
| MAU (Monthly Active Users) | Unika användare senaste 30 dagar | +20%/månad |
| DAU/MAU Ratio | Daglig aktivitet / Månadsaktivitet | > 20% |
| Session Duration | Genomsnittlig tid per besök | > 5 min |
| Pages per Session | Antal sidor per besök | > 3 |
| Feature Adoption | % användare som provar ny feature | > 60% |
| Task Completion Rate | % som slutför påbörjad uppgift | > 80% |

### Användarmätvärden
| Metric | Definition | Mål |
|--------|------------|-----|
| Signup Conversion | % besökare som registrerar sig | > 15% |
| Activation Rate | % nya som gör key action | > 40% |
| Retention (Day 7) | % som återvänder efter 7 dagar | > 30% |
| Retention (Day 30) | % som återvänder efter 30 dagar | > 15% |
| Churn Rate | % användare som slutar/månad | < 10% |
| NPS Score | Net Promoter Score | > 50 |

### Affärsmätvärden
| Metric | Definition | Mål |
|--------|------------|-----|
| CAC (Customer Acquisition Cost) | Kostnad per ny användare | Optimera |
| Support Tickets per User | Antal ärenden / användare | < 0.1 |
| Time to Value | Tid till första success | < 10 min |

---

## 🛠️ Tech Stack

### Verktyg
```
- Database: PostgreSQL (SQL queries)
- Analytics: Metabase / Tableau / Looker
- Event Tracking: Segment / Amplitude / Mixpanel
- A/B Testing: Optimizely / GrowthBook / PostHog
- Visualization: Metabase, Tableau, Python (Matplotlib, Plotly)
- Spreadsheets: Excel, Google Sheets
- Documentation: Notion, Confluence
```

### SQL-kompetens
- [ ] Komplexa JOINs och subqueries
- [ ] Window functions
- [ ] CTEs (Common Table Expressions)
- [ ] Aggregatfunktioner
- [ ] Performance-optimering

---

## 📈 Dashboards

### Executive Dashboard (för CEO/CPO)
- MAU/DAU trend
- Retention curves
- Feature adoption rates
- Revenue (om aktuellt)
- Top 3 insikter denna vecka

### Product Dashboard (för CPO/PM)
- Feature usage breakdown
- Funnel analysis
- A/B-testresultat
- User segmentation
- Feedback sentiment

### Engineering Dashboard (för CTO)
- API response times
- Error rates
- Deploy frequency
- Tech debt metrics
- System health

### Customer Success Dashboard
- Support ticket trends
- User satisfaction
- Onboarding completion
- Feature requests
- Churn risk indicators

---

## 🔄 Analysprocess

### 1. Frågeställning
- Vad vill vi veta?
- Vilken beslut ska fattas?
- Vilken data behövs?

### 2. Data Collection
- Hämta från databas/warehouse
- Validera kvalitet
- Dokumentera källor

### 3. Analysis
- Utforska mönster
- Segmentera användare
- Identifiera avvikelser
- Korrelationsanalys

### 4. Visualization
- Välj rätt chart-typ
- Tydliga etiketter och titlar
- Färger för att framhäva insikter
- Interaktivitet om möjligt

### 5. Communication
- Executive summary
- Key findings
- Rekommendationer
- Next steps

---

## 🔄 Dagliga Arbetsuppgifter

### Varje Dag
- [ ] Granska dashboards för avvikelser
- [ ] Svara på datafrågor från teamet
- [ ] Uppdatera key metrics
- [ ] Dokumentera insikter

### Varje Vecka
- [ ] Weekly metrics report till CPO/CEO
- [ ] A/B-test status review
- [ ] Data quality check
- [ ] Ad-hoc analyser vid behov
- [ ] Sync med Product Manager

### Varje Månad
- [ ] Månadsrapport med trender
- [ ] Retention analysis
- [ ] Cohort analysis
- [ ] Benchmark mot mål
- [ ] Rekommendationer till ledningen

---

## 🧪 A/B-testning

### Process
1. **Hypotes**: Om vi gör X, förväntar vi oss Y
2. **Mätetal**: Primärt och sekundärt
3. **Duration**: Hur länge köra testet
4. **Sample size**: Hur många användare behövs
5. **Analysis**: Statistisk signifikans (p < 0.05)

### Mall
```markdown
# A/B-test: [Feature/Namn]

## Hypotes
[Om vi ändrar X, kommer Y öka med Z%]

## Variants
- Control: [Nuvarande]
- Treatment: [Ny variant]

## Success Metric
[Primärt mätvärde]

## Duration
[Start] - [End]

## Result
[Winner + uplift %]

## Recommendation
[Implementera / Avbryt / Iterera]
```

---

## 🗣️ Kommunikation

### Rapporterar Till
- **CTO** - Data-infrastruktur, pipelines
- **CPO** - Produkt-analys, prioriteringar

### Samarbetar Med
- **Product Manager** - Feature-analys
- **Marketing** - Kampanj-analys
- **Customer Success** - Användarfeedback-analys
- **Alla team** - Data-support och insikter

### Kommunikationskanaler
- **#data-analytics** - Analys-diskussioner
- **#metrics** - Mätvärden och dashboards
- **#ab-tests** - Testresultat

---

## ✅ Checklista - Första 30 Dagarna

### Vecka 1: Inventering
- [ ] Förstå databasstruktur
- [ ] Lista tillgängliga datakällor
- [ ] Granska befintliga rapporter
- [ ] Möte med varje team för att förstå behov
- [ ] Identifiera data-quality issues

### Vecka 2: Setup
- [ ] Välja och sätta upp analytics-verktyg
- [ ] Skapa första dashboards
- [ ] Definiera key metrics
- [ ] Dokumentera data-definitioner
- [ ] Sätta upp event tracking

### Vecka 3: Analys
- [ ] Genomföra första djupanalys
- [ ] Segmentera användare
- [ ] Identifiera trender och mönster
- [ ] A/B-test planering
- [ ] Presentera insikter för teamet

### Vecka 4: Process
- [ ] Automatisera rapporter
- [ ] Dokumentera analysprocess
- [ ] Sätta upp alerting på metrics
- [ ] Planera kommande analyser
- [ ] Månatlig rapportmall

---

## 🛠️ Verktyg

- **SQL**: Postico, TablePlus, psql
- **Analytics**: Metabase, Tableau, Looker
- **Python**: Pandas, Matplotlib, Plotly (valfritt)
- **Spreadsheets**: Excel, Google Sheets
- **Documentation**: Notion, Confluence

---

*Rapporterar till: CTO (tekniskt), CPO (produkt)*
