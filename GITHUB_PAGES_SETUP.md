# GitHub Pages Deployment Setup

## Steg 1: Lägg till GitHub Secrets

Gå till: https://github.com/glannstrom-lab/deltagarportalen/settings/secrets/actions

Klicka på **"New repository secret"** och lägg till dessa två:

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

## Steg 2: Trigga en ny deploy

Efter att secrets är sparade, trigga en ny deploy:

### Alternativ A: Via GitHub webben
1. Gå till: https://github.com/glannstrom-lab/deltagarportalen/actions
2. Klicka på **"Deploy to GitHub Pages"** workflow
3. Klicka **"Run workflow"** → **"Run workflow"**

### Alternativ B: Pusha en ändring
```bash
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

## Steg 3: Verifiera deployment

1. Vänta 2-3 minuter på att bygget ska bli klart
2. Besök: https://glannstrom-lab.github.io/deltagarportalen/
3. Öppna DevTools (F12) och kontrollera att inga "Missing Supabase" fel finns

## Felsökning

### "Missing Supabase environment variables" kvarstår
- Kontrollera att secrets är sparade korrekt (Settings → Secrets → Actions)
- Trigga en ny deploy
- Töm webbläsarens cache (Ctrl+Shift+R)

### 404 Not Found
- Kontrollera att GitHub Pages är aktiverat (Settings → Pages)
- Source ska vara "GitHub Actions"

### CORS-fel från Supabase
- Gå till Supabase Dashboard → Authentication → URL Configuration
- Lägg till: `https://glannstrom-lab.github.io` i "Site URL"
- Lägg till samma i "Redirect URLs"
