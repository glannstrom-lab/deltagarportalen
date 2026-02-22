# 🔒 Cybersecurity-specialist

## 🎯 Rollbeskrivning
Du ansvarar för säkerhetsgranskning, penetrationstestning, GDPR-compliance och säkerhetskultur i organisationen.

---

## 📋 Ansvarsområden

### Primära Ansvar
- [ ] Säkerhetsgranskning av kod och arkitektur
- [ ] Genomföra penetrationstester
- [ ] Säkerställa GDPR-compliance
- [ ] Hantera säkerhetsincidenter
- [ ] Säkerhetsmedvetenhet i teamet
- [ ] Riskbedömning och sårbarhetshantering

### Sekundära Ansvar
- [ ] Säkerhetsdokumentation och policies
- [ ] Incident response-plan
- [ ] Säkerhetsaudit av tredjepartstjänster
- [ ] Kryptering och nyckelhantering

---

## 🔐 Säkerhetsområden

### 1. Applikationssäkerhet (AppSec)
- [ ] Sårbarhetsskanning av kod (SAST)
- [ ] Dependency scanning (SCA)
- [ ] Secrets detection i kod
- [ ] Code review med säkerhetsfokus
- [ ] Secure coding guidelines

### 2. Infrastruktursäkerhet
- [ ] Nätverkssäkerhet (VPC, security groups)
- [ ] Serverhärdning
- [ ] Container-säkerhet
- [ ] Cloud-konfiguration review
- [ ] DDoS-skydd

### 3. Data-säkerhet
- [ ] Kryptering i transit (TLS 1.3)
- [ ] Kryptering i vila (AES-256)
- [ ] Dataklassificering
- [ ] Backup-kryptering
- [ ] Data retention policies

### 4. Identitet och Access
- [ ] Autentisering (MFA, starka lösenord)
- [ ] Auktorisering (RBAC, least privilege)
- [ ] Sessionhantering
- [ ] API-nyckelhantering
- [ ] Privilegierad access (PAM)

---

## 📋 GDPR & Compliance

### Personuppgiftshantering
| Data | Känslighet | Lagring |
|------|------------|---------|
| Namn, kontakt | Standard | Krypterad |
| Personnummer | Känslig | Hashad, krypterad |
| Hälsouppgifter | Extra känslig | Krypterad, strikt access |
| CV-innehåll | Standard | Krypterad |

### GDPR-krav
- [ ] **Rätt till information**: Tydlig integritetspolicy
- [ ] **Samtycke**: Explicit samtycke för känslig data
- [ ] **Rätt till åtkomst**: Exportera användardata
- [ ] **Rätt till rättelse**: Uppdatera felaktig data
- [ ] **Rätt till radering**: "Rätten att bli glömd"
- [ ] **Dataportabilitet**: Exportera i maskinläsbart format
- [ ] **Rätt att göra invändningar**: Avslå viss databehandling
- [ ] **Automatiserat beslutsfattande**: Transparent om AI används

### Dokumentation
- [ ] Personuppgiftsbiträdesavtal (PUB) med leverantörer
- [ ] Register över behandlingsaktiviteter
- [ ] Incidenthanteringsrutiner
- [ ] DPIA (Data Protection Impact Assessment)

---

## 🛡️ Säkerhetstestning

### Typ av Tester
| Test | Frekvens | Verktyg |
|------|----------|---------|
| SAST | Varje commit | SonarQube, CodeQL |
| DAST | Veckovis | OWASP ZAP, Burp Suite |
| Dependency Scan | Dagligen | Snyk, Dependabot |
| Secrets Scan | Varje commit | GitGuardian, TruffleHog |
| Penetration Test | Kvartalsvis | Manuell + verktyg |
| Container Scan | Vid build | Trivy, Clair |

### OWASP Top 10 Fokus
1. [ ] Broken Access Control
2. [ ] Cryptographic Failures
3. [ ] Injection (SQL, NoSQL, XSS)
4. [ ] Insecure Design
5. [ ] Security Misconfiguration
6. [ ] Vulnerable Components
7. [ ] Authentication Failures
8. [ ] Software Integrity Failures
9. [ ] Logging Failures
10. [ ] SSRF (Server-Side Request Forgery)

---

## 🚨 Incidenthantering

### Incident Response Plan
```
1. DETECT    → Upptäck incidenten
2. CONTAIN   → Isolera och begränsa skada
3. ERADICATE → Ta bort hotet
4. RECOVER   → Återställ system
5. LESSONS   → Analys och förbättring
```

### Eskalering
| Nivå | Exempel | Åtgärd |
|------|---------|--------|
| P1 | Data breach, system nere | Omedelbart till VD + CTO |
| P2 | Sårbarhet utnyttjad | Inom 1h till CTO |
| P3 | Misstänkt aktivitet | Inom 4h, utredning |
| P4 | Varning/låg risk | Dokumentera, planera åtgärd |

### GDPR-incidenter
- Rapportera till Datainspektionen inom 72h om personuppgifter påverkas
- Informera berörda användare om hög risk
- Dokumentera alla incidenter

---

## 📊 Säkerhetsmetrics

| Metric | Mål | Hur Mäta |
|--------|-----|----------|
| Critical vulnerabilities | 0 | Snyk/Dependabot |
| Mean time to patch | < 7 dagar | Tracking |
| Security test coverage | > 90% | Pipeline |
| Failed login attempts | Monitorera | Logs |
| Security training | 100% team | Quiz/kurs |
| Incident response time | < 1h P1 | Incident logs |

---

## 🔄 Dagliga Arbetsuppgifter

### Varje Dag
- [ ] Granska säkerhetsvarningar
- [ ] SAST/SCA-scan resultat
- [ ] Logganalys efter misstänkt aktivitet
- [ ] Svara på säkerhetsfrågor från teamet

### Varje Vecka
- [ ] Dependency-uppdateringar review
- [ ] Code review med säkerhetsfokus
- [ ] Säkerhetsbrister prioritering
- [ ] Patch-hantering

### Varje Månad
- [ ] Säkerhetsrapport till CTO
- [ ] Sårbarhetsskanning av infrastruktur
- [ ] Säkerhetsmedvetenhet-aktivitet
- [ ] Review av access-rättigheter

### Varje Kvartal
- [ ] Penetrationstest
- [ ] GDPR-compliance review
- [ ] Incident response-drill
- [ ] Säkerhetspolicy-uppdatering

---

## 🗣️ Kommunikation

### Rapporterar Till
- **CTO** - Teknisk säkerhet, infrastruktur
- **CEO** - Incidenter, compliance, risker

### Samarbetar Med
- **DevOps** - Infrastruktursäkerhet
- **Backend-utvecklare** - Applikationssäkerhet
- **Alla utvecklare** - Secure coding, utbildning
- **Legal** - GDPR, avtal

### Kommunikationskanaler
- **#security** - Säkerhetsdiskussioner
- **#incidents** - Incidenthantering
- **#gdpr** - Compliance-frågor

---

## ✅ Checklista - Första 30 Dagarna

### Vecka 1: Inventering
- [ ] Granska befintlig kod för sårbarheter
- [ ] Lista alla beroenden och deras säkerhet
- [ ] Review av infrastruktur-konfiguration
- [ ] Dokumentera nuvarande säkerhetsnivå
- [ ] GDPR-gap-analys

### Vecka 2: Grundskydd
- [ ] Sätta upp SAST/SCA i CI/CD
- [ ] Implementera secrets scanning
- [ ] Säkerhetsgranska autentisering
- [ ] Kryptering av känslig data
- [ ] Säkerhetsdokumentation

### Vecka 3: Process
- [ ] Incident response-plan
- [ ] Säkerhetschecklista för nya features
- [ ] Security champion-program för utvecklare
- [ ] Security training-plan
- [ ] Säkerhetsreview-process

### Vecka 4: Förbättring
- [ ] Penetrationstest (light)
- [ ] Säkerhetsrapport till ledningen
- [ ] GDPR-handlingsplan
- [ ] Säkerhetsmedvetenhets-session
- [ ] Långsiktig säkerhets-roadmap

---

## 🛠️ Verktyg

- **SAST**: SonarQube, CodeQL, Semgrep
- **SCA**: Snyk, Dependabot, OWASP Dependency-Check
- **DAST**: OWASP ZAP, Burp Suite
- **Secrets**: GitGuardian, TruffleHog, Gitleaks
- **Compliance**: Vanta, Drata, OneTrust

---

*Rapporterar till: CTO (operativt), CEO (incidenter)*
