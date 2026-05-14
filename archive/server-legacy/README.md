# ⚠️ INAKTIV - Gammal Node.js Backend

**Denna mapp används INTE i produktion!**

## Nuvarande Arkitektur

All backend körs via **Supabase**:
- **Auth:** Supabase Auth
- **Database:** PostgreSQL (Supabase)
- **API:** Supabase JavaScript Client
- **Serverless:** Supabase Edge Functions
- **Storage:** Supabase Storage

## Varför finns denna mapp kvar?

- Historisk referens
- Potentiell framtida användning om ni flyttar från Supabase
- Innehåller viss logik som kan vara referens för Edge Functions

## Användning

**⛔ Använd INTE denna backend!**

Se istället:
- `/supabase/functions/` - Aktiva Edge Functions
- `/supabase/migrations/` - Databasschema
- `/SUPABASE_ONLY_SETUP.md` - Setup-guide för Supabase

---

*Denna backend var aktiv under tidig utveckling men har ersatts av Supabase.*
