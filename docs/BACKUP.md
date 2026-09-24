# Databasbackup — hur den tas och hur den återställs

## Läget

- Supabase-projektet ligger på **gratisplanen**. Där tar Supabase **inga** backuper och
  PITR finns inte (mätt 2026-09-24 via Supabases API: `plan: "free"`).
- Portalens enda backup är därför vår egen: `.github/workflows/backup.yml`, varje natt
  02:17 UTC, och den går också att starta för hand (Actions → Databasbackup → Run workflow).
- Varje körning ger en artefakt `databasbackup-<run_id>` med fyra krypterade filer, sparad i
  **30 dagar**:

  | Fil | Innehåll |
  |---|---|
  | `roller.sql.enc` | egna databasroller |
  | `schema.sql.enc` | tabeller, vyer, funktioner, RLS-policyer, triggrar |
  | `data.sql.enc` | all data, också `auth.users` och `storage.objects` (metadata) |
  | `cron-jobb.json.enc` | pg_cron-jobben — `db dump` tar inte med cron-schemat |

- **Vercel Blob (profilbilder) ingår inte.** Storage i Supabase innehöll en fil 2026-09-24.
- Förlust upp till ett dygn är möjlig. Vill vi ha mindre krävs Supabase Pro + PITR.
- **Vercel-rollback återställer koden, aldrig data.**

## Kryptering

`scripts/backup/backup-krypto.cjs` (ren Node): AES-256-GCM, nyckel ur scrypt, eget salt per
fil. Dumpen strömmas via stdin och krypteras i minnet, och varje fil läses tillbaka innan den
skrivs. Klartexten rör aldrig runnerns disk.

**Repot är publikt**, så artefakterna kan laddas ner av alla som är inloggade på GitHub. Det
är krypteringen som skyddar dem, därför kräver skriptet ett lösenord på minst 32 tecken.

Lösenordet ligger i GitHub-hemligheten `BACKUP_LOSENORD` (miljön `production`) **och måste
dessutom finnas utanför GitHub**, i en lösenordshanterare. En hemlighet i GitHub går inte att
läsa ut igen, och utan lösenordet är varenda backup oläsbar.

Byter du lösenord: spara det gamla tills de äldsta artefakterna (30 dagar) har gallrats.

## Kontroll varje natt

Steget "Inventera och kontrollera" dekrypterar data-dumpen i minnet och räknar rader per
tabell (bara namn och antal hamnar i loggen). Körningen blir röd om `auth.users` eller
`public.profiles` saknas eller är tom. Sammanfattningen står på körningens sida.

## Återställningsprov 2026-09-24

Gjort lokalt: prod dumpades krypterat och dekrypterades rakt in i en tom
`supabase/postgres:17.6.1.063` i Docker.

- **Alla 149 tabeller i `public` fick exakt samma radantal som dumpen.** Inga fel.
- De 31 tabellerna i `auth` och `storage` gick inte att läsa in. Det beror på att de skapas av
  Supabases Auth- och Storage-tjänster, som inte finns i en ren Postgres-bild. I ett riktigt
  Supabase-projekt finns de. Återställ därför alltid till ett **Supabase-projekt**, inte
  till en vanlig Postgres.

## Återställa

Återställ **till ett nytt Supabase-projekt**, aldrig rakt över prod. En hel dump över prod
raderar allt som hänt sedan natten. Vid delvis dataförlust: återställ till ett nytt projekt och
flytta över de rader som saknas.

```bash
# 1. Ladda ner artefakten (Actions → Databasbackup → välj körning → Artifacts) och packa upp.
export BACKUP_LOSENORD='…'                  # ur lösenordshanteraren
K=scripts/backup/backup-krypto.cjs

# 2. Kontrollera att filerna går att läsa och ser rimliga ut.
node $K inventera < data.sql.enc | tail -5

# 3. Läs in i det NYA projektet. Anslutningssträngen: nya projektet → Connect →
#    Session pooler (GitHub och många nät saknar IPv6). Klartexten går via stdin.
{
  node $K dekryptera < roller.sql.enc
  node $K dekryptera < schema.sql.enc
  echo "SET session_replication_role = replica;"   # cirkulära FK:er, se pg_dump-varningen
  node $K dekryptera < data.sql.enc
} | psql --single-transaction -v ON_ERROR_STOP=1 "$NY_DB_URL"

# 4. pg_cron-jobben: läs dem och lägg upp dem igen med cron.schedule(...).
node $K dekryptera < cron-jobb.json.enc
```

Efteråt: lägg in hemligheter som inte ligger i databasen (Vault-värden, `CRON_SECRET`,
edge-funktionernas secrets), deploya edge-funktionerna och peka Vercels miljövariabler mot
det nya projektet.

Följer du Supabases guide ordagrant (`psql --file roles.sql --file schema.sql …`) måste
filerna först dekrypteras till disk. Radera dem direkt efteråt. De innehåller personuppgifter
och hälsodata (art. 9).
