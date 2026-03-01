# 📦 Supabase Deploy Guide

> **Snabbguide:** Vad scriptet gör automatiskt vs vad du måste göra manuellt

---

## 🔄 Automatiskt (via deploy-to-supabase.ps1)

När du kör `deploy-to-supabase.ps1` händer detta automatiskt:

### ✅ Detta görs automatiskt:

| Åtgärd | Status |
|--------|--------|
| Kontrollera Supabase CLI | ✅ |
| Kontrollera inloggning | ✅ |
| Linka projekt | ✅ |
| Deploya Edge Functions | ✅ |
| Köra database migrations | ✅ |
| Lista miljövariabler som behövs | ✅ |

---

## 👤 Manuellt (måste göras i Supabase Dashboard)

Efter att scriptet har körts, behöver du logga in i Supabase Dashboard och göra följande:

### 1️⃣ Konfigurera Miljövariabler

**Var:** Dashboard > Project Settings > Edge Functions

**Du måste lägga till:**

```
SUPABASE_URL=https://ditt-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  (hittas under Settings > API)
OPENAI_API_KEY=sk-...              (från OpenAI dashboard)
SITE_URL=https://din-hemsida.se    (eller http://localhost:5173 för dev)
```

**Varför:** Edge Functions behöver dessa för att kunna kommunicera med databasen och externa API:er.

---

### 2️⃣ Verifiera Edge Functions

**Var:** Dashboard > Edge Functions

**Kolla att dessa finns:**
- ai-cover-letter
- cv-analysis
- af-jobsearch
- af-taxonomy
- af-enrichments
- af-jobed
- af-trends
- send-invite-email ← **NY!**

**Om någon saknas:**
```bash
supabase functions deploy <namn>
```

---

### 3️⃣ Verifiera Database Tables

**Var:** Dashboard > Table Editor

**Kolla att dessa tabeller finns:**
- profiles
- cvs
- cv_versions
- cover_letters
- interest_results
- saved_jobs
- articles
- consultant_notes
- invitations ← **NY!**

**Om invitations saknas:**
```bash
supabase migration up
```

---

### 4️⃣ Konfigurera Auth (valfritt men rekommenderat)

**Var:** Dashboard > Authentication > Settings

**Uppdatera:**
- Site URL: Din faktiska URL
- Redirect URLs: Lägg till din domän

**Varför:** Så att email-länkar och omdirigeringar fungerar korrekt.

---

## 🚀 Snabbstart

### Steg 1: Kör scriptet
```powershell
.\deploy-to-supabase.ps1
```

### Steg 2: Gå till Supabase Dashboard
Öppna: https://app.supabase.com/project/ditt-project-ref

### Steg 3: Konfigurera miljövariabler
Gå till: Project Settings > Edge Functions

Lägg till:
- SUPABASE_SERVICE_ROLE_KEY (från Settings > API)
- OPENAI_API_KEY (från OpenAI)
- SITE_URL (din domän)

### Steg 4: Verifiera
Kolla att:
- ✅ Alla Edge Functions finns
- ✅ Alla tabeller finns
- ✅ RLS är aktiverat på tabeller

### Steg 5: Testa
Testa i frontend:
- Registrera ny användare
- Logga in
- Testa att bjuda in deltagare (som konsulent)

---

## ❓ Vanliga frågor

### Q: Varför måste jag göra vissa saker manuellt?
**A:** Säkerhet! Vissa saker som service_role_key och API-nycklar kan inte sättas automatiskt av säkerhetsskäl. Du måste logga in i dashboard och klistra in dem själv.

### Q: Vad händer om jag glömmer sätta miljövariabler?
**A:** Edge Functions kommer att faila. Du kommer se felmeddelanden i frontend som "Function execution failed".

### Q: Hur vet jag om allt fungerar?
**A:** Gå till Dashboard > Logs och kolla att:
1. Inga röda felmeddelanden
2. Auth events loggas
3. Edge Function calls visas

### Q: Kan jag köra scriptet flera gånger?
**A:** Ja! Det är idempotent (kan köras flera gånger utan problem).

---

## 📋 Checklista för dig

Efter att ha kört scriptet, bocka av:

- [ ] Jag har loggat in i Supabase Dashboard
- [ ] Jag har lagt till miljövariablerna
- [ ] Jag har verifierat att alla Edge Functions finns
- [ ] Jag har verifierat att alla tabeller finns
- [ ] Jag har testat att registrera en ny användare
- [ ] Jag har testat att logga in

---

## 🆘 Hjälp!

Om något går fel:

1. **Kolla logs:** Dashboard > Logs
2. **Testa lokalt:** `supabase functions serve`
3. **Fråga teamet:** Dela felmeddelandet

---

*Detta är allt du behöver göra! Resten sköts automatiskt av scriptet.* 🎉
