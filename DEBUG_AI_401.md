# 🔐 Debug: AI Cover Letter 401 Fel

## Problemet

Du får `401 Unauthorized` när du försöker generera ett personligt brev med AI.

Detta betyder att Supabase Edge Function inte kan validera din inloggningstoken.

---

## 🔍 Steg 1: Verifiera miljövariabler

Detta är det vanligaste problemet!

### Gå till Supabase Dashboard:

1. Öppna: https://supabase.com/dashboard/project/odcvrdkvzyrbdzvdrhkz/settings/functions

2. Kolla att dessa miljövariabler finns:

| Variabel | Värde | Status |
|----------|-------|--------|
| `SUPABASE_URL` | `https://odcvrdkvzyrbdzvdrhkz.supabase.co` | ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (börjar med eyJ) | ☐ |
| `OPENAI_API_KEY` | `sk-...` (din OpenAI key) | ☐ |

**Om någon saknas:**
- Klicka **"New Secret"**
- Lägg till den saknade variabeln
- Klicka **Save**

---

## 🔍 Steg 2: Verifiera att Edge Function är deployad

1. Gå till: https://supabase.com/dashboard/project/odcvrdkvzyrbdzvdrhkz/functions
2. Kolla att `ai-cover-letter` finns i listan
3. Om den saknas, kör:

```bash
supabase functions deploy ai-cover-letter
```

---

## 🔍 Steg 3: Testa direkt i terminalen

Öppna terminal och kör:

```bash
# Hämta din access token (logga in på sidan först och kolla dev tools)
# Eller testa med curl:

curl -X POST https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/ai-cover-letter \
  -H "Authorization: Bearer <ditt-token-här>" \
  -H "Content-Type: application/json" \
  -d '{
    "cvData": {
      "firstName": "Test",
      "lastName": "Användare",
      "workExperience": [{"title": "Utvecklare", "company": "Företag"}]
    },
    "jobDescription": "Vi söker en utvecklare...",
    "companyName": "Test AB",
    "jobTitle": "Utvecklare"
  }'
```

---

## 🔍 Steg 4: Kolla Edge Function Logs

1. Gå till: https://supabase.com/dashboard/project/odcvrdkvzyrbdzvdrhkz/functions/ai-cover-letter/logs
2. Kolla efter felmeddelanden
3. Om du ser "Missing environment variables", gå tillbaka till Steg 1

---

## 🛠️ Snabbfix: Deploya om Edge Function

Om miljövariablerna är korrekta men det fortfarande inte fungerar:

### Alternativ A: Dubbelkolla variablerna

```bash
# Lista alla secrets
supabase secrets list --project-ref odcvrdkvzyrbdzvdrhkz
```

### Alternativ B: Deploya om med nya variabler

```bash
# Sätt miljövariabler
supabase secrets set SUPABASE_URL="https://odcvrdkvzyrbdzvdrhkz.supabase.co" --project-ref odcvrdkvzyrbdzvdrhkz

supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<din-service-role-key>" --project-ref odcvrdkvzyrbdzvdrhkz

supabase secrets set OPENAI_API_KEY="<din-openai-key>" --project-ref odcvrdkvzyrbdzvdrhkz

# Deploya om funktionen
supabase functions deploy ai-cover-letter --project-ref odcvrdkvzyrbdzvdrhkz
```

---

## ✅ Kontrollista

- [ ] SUPABASE_URL är satt i Supabase Dashboard
- [ ] SUPABASE_SERVICE_ROLE_KEY är satt
- [ ] OPENAI_API_KEY är satt
- [ ] ai-cover-letter function är deployad
- [ ] Jag har loggat ut och in igen på webbsidan

---

## 🆘 Om inget fungerar

Gör en "hard reset":

1. **Logga ut** från Deltagarportalen
2. **Rensa browser cache** (Ctrl+Shift+Delete)
3. **Logga in** igen
4. Testa generera brev

---

## 📞 Hitta din Service Role Key

1. Gå till: https://supabase.com/dashboard/project/odcvrdkvzyrbdzvdrhkz/settings/api
2. Scrolla ner till "Project API keys"
3. Kopiera **service_role key** (den hemliga, börjar med `eyJhbG...`)

---

*Senast uppdaterad: 2026-03-01*
