# 📦 Arkiverad Kod

Denna mapp innehåller föråldrad kod som har ersatts av modernare lösningar.

## ⚠️ PHP Backend (php-backend-deprecated)

**Status:** ERSATT av Supabase  
**Datum:** 2026-03-01  
**Anledning:** Säkerhetsrisker, dubbel komplexitet

### Varför togs den bort?

1. **Säkerhetsrisker**
   - Hardkodad JWT-secret
   - Osäker CORS-konfiguration (`*`)
   - Ingen rate limiting
   - SQLite istället för PostgreSQL

2. **Dubbel komplexitet**
   - Tre olika auth-system (Supabase + PHP + Zustand)
   - Dubbla databaser (PostgreSQL + SQLite)
   - Svårt att underhålla och debugga

3. **Skalbarhet**
   - PHP/SQLite klarar inte hög belastning
   - Supabase erbjuder automatisk skalning

### Vad ersätter den?

| Gammalt | Nytt |
|---------|------|
| `php-backend/api/index.php` | Supabase Edge Functions |
| `php-backend/lib/Auth.php` | Supabase Auth |
| `php-backend/lib/Database.php` | Supabase PostgreSQL |
| SQLite | PostgreSQL |
| JWT (egen) | Supabase Auth |

### Kan jag återställa den?

**Rekommendation:** Nej, använd Supabase istället.

Om du absolut måste återställa den:
```bash
# Flytta tillbaka (INTE REKOMMENDERAT)
mv archive/php-backend-deprecated php-backend
```

Men kom ihåg:
- Säkerhetsrisker kommer att finnas kvar
- Du förlorar alla fördelar med Supabase
- Framtida utveckling sker i Supabase

### Support

Frågor om migrering? Se `SUPABASE_MIGRATION_PLAN.md` i projektroten.
