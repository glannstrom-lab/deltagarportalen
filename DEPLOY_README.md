# 🚀 Deploy till Supabase - Snabbstart

## 📍 Var är jag?

Du är i projektroten: `C:\Users\Mikael\Desktop\SKARP AI\deltagarportal`

Härifrån kör du deploy-kommandona.

---

## ⚡ Snabbaste sättet att deploya

### Alternativ 1: Enkel batch-fil (Rekommenderad för Windows)

```cmd
# I samma mapp som denna fil, kör:
deploy-simple.bat
```

Detta deployar allt automatiskt. Sedan visar den instruktioner för vad du måste göra manuellt.

---

### Alternativ 2: PowerShell (Om batch inte fungerar)

```powershell
# Kör detta i PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\deploy-to-supabase.ps1
```

---

### Alternativ 3: Manuellt steg-för-steg

Om automatiken inte fungerar, kör dessa kommandon en i taget:

```bash
# 1. Logga in (om du inte redan är inloggad)
supabase login

# 2. Linka projektet (ersätt med ditt project-ref)
supabase link --project-ref abcdefghijklmnopqrst

# 3. Deploya alla Edge Functions
supabase functions deploy ai-cover-letter
supabase functions deploy cv-analysis
supabase functions deploy af-jobsearch
supabase functions deploy af-taxonomy
supabase functions deploy af-enrichments
supabase functions deploy af-jobed
supabase functions deploy af-trends
supabase functions deploy send-invite-email

# 4. Kör database migrations
supabase db push
```

---

## 🔧 Efter deploy - Vad du måste göra manuellt

**Logga in på:** https://app.supabase.com

### 1. Sätt miljövariabler
**Gå till:** Dashboard → Project Settings → Edge Functions

Lägg till:
```
SUPABASE_URL=https://ditt-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (hittas under Settings > API)
OPENAI_API_KEY=sk-... (från OpenAI dashboard)
SITE_URL=https://dinsida.se
```

### 2. Verifiera
**Gå till:** Dashboard → Edge Functions
- Kolla att alla 8 functions finns listade

**Gå till:** Dashboard → Database → Tables
- Kolla att `invitations` tabellen finns

### 3. Klart! 🎉

---

## 🆘 Felsökning

### "Supabase CLI inte hittad"
```bash
npm install -g supabase
```

### "Inte inloggad"
```bash
supabase login
```

### "Kan inte hitta project-ref"
1. Gå till https://app.supabase.com
2. Välj ditt projekt
3. Kopiera ref från URL:en (t.ex. `abcdefghijklmnopqrst`)
4. Kör: `supabase link --project-ref abcdefghijklmnopqrst`

---

## 📞 Hjälp

Om inget fungerar, kör kommandona manuellt (Alternativ 3 ovan).

Eller fråga teamet! 
