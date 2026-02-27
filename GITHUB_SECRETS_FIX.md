# Fix: "Invalid API key" vid registrering

## Problem
Bygget har inte fått med Supabase API-nycklarna. Detta händer när GitHub Secrets inte är konfigurerade.

## Steg 1: Kontrollera GitHub Secrets

Gå till: https://github.com/glannstrom-lab/deltagarportalen/settings/secrets/actions

Du ska se dessa secrets:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

Om de saknas, lägg till dem:

### Secret 1: VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://odcvrdkvzyrbdzvdrhkz.supabase.co
```

### Secret 2: VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY3ZyZGt2enlyYmR6dmRyaGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjU1NzcsImV4cCI6MjA4NzQ0MTU3N30.StWwqG3cVo1ItJ5Z59eQzBGBH4ttIHypupcKzkAYXus
```

## Steg 2: Trigga ombyggnad

Efter att secrets är sparade:

1. Gå till: https://github.com/glannstrom-lab/deltagarportalen/actions/workflows/deploy.yml
2. Klicka **"Run workflow"** → **"Run workflow"**
3. Vänta 2-3 minuter
4. Testa igen på https://glannstrom-lab.github.io/deltagarportalen/

## Alternativ: Lokal build för test

Om GitHub Actions fortfarande strular, kan du bygga lokalt:

```bash
cd client

# Skapa .env fil
echo "VITE_SUPABASE_URL=https://odcvrdkvzyrbdzvdrhkz.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY3ZyZGt2enlyYmR6dmRyaGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjU1NzcsImV4cCI6MjA4NzQ0MTU3N30.StWwqG3cVo1ItJ5Z59eQzBGBH4ttIHypupcKzkAYXus" >> .env

# Bygg
npm run build

# Deploya dist/-mappen manuellt till GitHub Pages
```

## Verifiera att det fungerar

Öppna DevTools (F12) → Console. Du ska INTE se:
```
Missing Supabase environment variables
```

Om du fortfarande ser detta, kontrollera:
1. Att secrets är sparade korrekt (inga extra mellanslag)
2. Att workflow har körts om efter secrets sparades
3. Att webbläsarcachen är tömd (Ctrl+Shift+R)
