# 🚀 Deploy Cheat Sheet

## Snabbkommandon

### 1. Kör deploy script
```powershell
.\deploy-to-supabase.ps1
```

### 2. Deploya en specifik function
```bash
supabase functions deploy send-invite-email
```

### 3. Kolla function logs
```bash
supabase functions serve --env-file .env
```

### 4. Kör migrations
```bash
supabase db push
```

---

## Viktiga URLs

| Resurs | URL |
|--------|-----|
| Supabase Dashboard | https://app.supabase.com |
| Ditt projekt | https://app.supabase.com/project/`ditt-ref` |
| Edge Functions | https://app.supabase.com/project/`ditt-ref`/functions |
| Database | https://app.supabase.com/project/`ditt-ref`/database/tables |
| Auth | https://app.supabase.com/project/`ditt-ref`/auth/users |

---

## Hitta dina nycklar

### Project Ref
Dashboard > Settings > General > Reference ID

### Anon Key  
Dashboard > Settings > API > Project API keys > `anon`

### Service Role Key
Dashboard > Settings > API > Project API keys > `service_role`

### OpenAI Key
https://platform.openai.com/api-keys

---

## Miljövariabler att sätta

I Dashboard > Project Settings > Edge Functions:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
SITE_URL=https://dinsida.se
```

---

## Testa efter deploy

### Testa auth
```bash
# Registrera
curl -X POST https://xxxx.supabase.co/auth/v1/signup \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}'
```

### Testa function
```bash
curl -X POST https://xxxx.supabase.co/functions/v1/ai-cover-letter \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"cvData":{},"jobDescription":"test"}'
```

---

## Felsökning

### "Function execution failed"
→ Kolla att miljövariabler är satta

### "RLS policy violation"
→ Kolla RLS policies i Table Editor

### "Token expired"
→ Logga ut och in igen

### "Migration failed"
→ Kör: `supabase db reset` sen `supabase db push`

---

## Support

- Supabase Docs: https://supabase.com/docs
- Logs: Dashboard > Logs
- Teamet: Fråga i chatten

---

*Skriv ut och ha bredvid dig vid deploy!* 📄
