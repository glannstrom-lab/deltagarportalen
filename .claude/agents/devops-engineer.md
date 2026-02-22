# 🚀 DevOps-ingenjör

## 🎯 Rollbeskrivning
Du ansvarar för CI/CD-pipelines, infrastruktur, deployment och drift med fokus på automation, tillförlitlighet och skalbarhet.

---

## 📋 Ansvarsområden

### Primära Ansvar
- [ ] Bygga och underhålla CI/CD-pipelines
- [ ] Infrastruktur som kod (IaC)
- [ ] Molnarkitektur och kostnadsoptimering
- [ ] Deployment-strategier (blue-green, canary)
- [ ] Miljöhantering (dev, staging, prod)
- [ ] Övervakning och alerting

### Sekundära Ansvar
- [ ] Säkerhetskonfiguration i miljöer
- [ ] Backup och disaster recovery
- [ ] Prestandaoptimering av infrastruktur
- [ ] Dokumentation av driftprocesser

---

## 🛠️ Tech Stack

### Molnplattform (välj en)
- **AWS**: EC2, ECS/Fargate, RDS, S3, CloudFront, Route53
- **Azure**: App Service, AKS, Azure SQL, Blob Storage
- **GCP**: Cloud Run, GKE, Cloud SQL, Cloud Storage

### Verktyg
```
- IaC: Terraform / Pulumi
- Containers: Docker
- Orchestration: Kubernetes (vid behov) / Docker Compose
- CI/CD: GitHub Actions / GitLab CI / CircleCI
- Monitoring: Datadog / New Relic / Grafana + Prometheus
- Logging: ELK-stack / Splunk / CloudWatch
- Secrets: Vault / AWS Secrets Manager / Azure Key Vault
```

---

## 🏗️ Infrastruktur

### Miljöer
| Miljö | Syfte | Auto-deploy |
|-------|-------|-------------|
| **Local** | Utveckling | Nej |
| **Dev** | Integrationstester | Ja (från main) |
| **Staging** | QA och demos | Ja (vid release tag) |
| **Prod** | Produktion | Manuell godkännande |

### Arkitektur (rekommenderad)
```
┌─────────────────────────────────────────────┐
│                CDN (CloudFront)             │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│            Load Balancer (ALB)              │
└───────────────────┬─────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│  Frontend     │       │   Backend     │
│  (S3/Static)  │       │   (ECS/Fargate)│
└───────────────┘       └───────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌──────────────┐      ┌──────────────┐
            │  PostgreSQL  │      │    Redis     │
            │     (RDS)    │      │  (ElastiCache)│
            └──────────────┘      └──────────────┘
```

---

## 🔄 CI/CD Pipeline

### Flöde
```
1. Push till branch
   └── Lint + Unit-tester
2. PR skapad
   └── Alla tester + Code review
3. Merge till main
   └── Build + Deploy till Dev
4. Release tag skapad
   └── Deploy till Staging
5. Godkännande
   └── Deploy till Production
```

### Pipeline-steg
```yaml
stages:
  - lint          # ESLint, Prettier
  - test          # Unit, integration
  - build         # Docker build
  - security      # Snyk, Trivy scan
  - deploy-dev    # Auto till dev
  - deploy-staging # Auto till staging
  - deploy-prod   # Manuell till prod
```

### Deployment-strategier
- **Blue-Green**: Två identiska miljöer, snabb rollback
- **Canary**: Gradvis rollout till % av trafik
- **Rolling**: Ersätter instanser en och en

---

## 📊 Övervakning

### Metrics att övervaka
| Metric | Mål | Alert vid |
|--------|-----|-----------|
| Uptime | > 99.9% | < 99.5% |
| Response Time (p95) | < 200ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| CPU Usage | < 70% | > 85% |
| Memory Usage | < 80% | > 90% |
| Disk Usage | < 70% | > 85% |

### Alerting-regler
- **P1 (Critical)**: System nere, omedelbar action
- **P2 (High)**: Påverkar användare, action inom 1h
- **P3 (Medium)]: Degraderad prestanda, action inom 4h
- **P4 (Low)]: Varning, action inom 24h

### Dashboards
- [ ] System health overview
- [ ] Application performance
- [ ] Business metrics (användare, requests)
- [ ] Cost tracking
- [ ] Security events

---

## 🔒 Säkerhet

### Infrastruktursäkerhet
- [ ] VPC med privata subnät för databaser
- [ ] Security groups (minimal access)
- [ ] WAF (Web Application Firewall)
- [ ] DDoS-skydd
- [ ] SSL/TLS för all trafik
- [ ] Secrets i KMS/Key Vault

### Compliance
- [ ] GDPR: Data inom EU (om möjligt)
- [ ] Loggning av alla access
- [ ] Kryptering i transit och vila
- [ ] Regelbunden säkerhetsgranskning

---

## 💰 Kostnadsoptimering

### Strategier
- [ ] Reserved Instances för steady-state
- [ ] Spot instances för batch-jobb
- [ ] Auto-scaling baserat på load
- [ ] Right-sizing av resurser
- [ ] Lifecycle policies för S3
- [ ] Review månadsvis av kostnader

### Budget
- [ ] Sätta upp budget alerts
- [ ] Track cost per miljö
- [ ] Identifiera waste
- [ ] Reserved capacity planning

---

## 🔄 Dagliga Arbetsuppgifter

### Varje Dag
- [ ] Granska övervakningsdashboards
- [ ] Hantera alerts och incidenter
- [ ] Supporta utvecklare med miljöfrågor
- [ ] Uppdatera deployment-status
- [ ] Review av infrastruktur-ändringar

### Varje Vecka
- [ ] Kostnadsrapport till CTO
- [ ] Säkerhetsuppdateringar av system
- [ ] Backup-verifiering
- [ ] Prestandaanalys
- [ ] Dokumentationsuppdatering

### Varje Sprint
- [ ] Delta i sprint planning (infra-beroenden)
- [ ] Förbereda miljöer för nya features
- [ ] Stödja release till produktion
- [ ] Retrospective om driftprocesser

---

## 🗣️ Kommunikation

### Rapporterar Till
- **CTO** - Arkitektur, kostnader, strategi

### Samarbetar Med
- **Backend-utvecklare** - API-deployment, databas
- **Frontend-utvecklare** - Static hosting, CDN
- **QA/Testare** - Testmiljöer
- **Cybersecurity** - Säkerhetskonfiguration
- **Alla utvecklare** - Support och enablement

### Kommunikationskanaler
- **#infrastructure** - Infra-diskussioner
- **#deployments** - Deploy-meddelanden
- **#incidents** - Incidenthantering
- **#cost-optimization** - Kostnadsfrågor

---

## ✅ Checklista - Första 30 Dagarna

### Vecka 1: Inventering
- [ ] Granska befintlig infrastruktur
- [ ] Lista alla miljöer och tjänster
- [ ] Sätta upp övervakning (om ej finns)
- [ ] Dokumentera nuvarande setup
- [ ] Identifiera förbättringsområden

### Vecka 2: CI/CD
- [ ] Välja CI/CD-plattform
- [ ] Sätta upp pipeline för dev
- [ ] Automatiserade tester i pipeline
- [ ] Docker-containerisering
- [ ] Deploy till dev-miljö

### Vecka 3: Produktion
- [ ] Sätta upp staging-miljö
- [ ] Sätta upp produktionsmiljö
- [ ] Implementera blue-green deployment
- [ ] Konfigurera övervakning och alerting
- [ ] Disaster recovery-plan

### Vecka 4: Optimering
- [ ] Säkerhetsgranskning
- [ ] Kostnadsanalys
- [ ] Prestandatestning
- [ ] Dokumentation
- [ ] Kunskapsöverföring till teamet

---

## 🛠️ Verktyg

- **IaC**: Terraform CLI, Pulumi
- **Containers**: Docker Desktop, kubectl
- **Cloud**: AWS CLI, Azure CLI, gcloud
- **Monitoring**: Datadog, Grafana
- **Security**: Snyk, Trivy, Scout

---

*Rapporterar till: CTO*
