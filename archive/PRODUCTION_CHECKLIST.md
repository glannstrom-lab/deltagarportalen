# Produktionschecklista

## ✅ Supabase-konfiguration

### Databas
- [ ] Alla tabeller skapade (`profiles`, `cvs`, `interest_results`, `cover_letters`, `articles`, `saved_jobs`)
- [ ] RLS policies aktiverade på alla tabeller
- [ ] Inga "infinite recursion"-fel i policies
- [ ] Trigger-funktion `handle_new_user` fungerar

### Autentisering
- [ ] Email-provider konfigurerad
- [ ] "Confirm email" AVSTÄNGD (för enklare demo)
- [ ] Site URL satt till produktionsdomän
- [ ] Redirect URLs konfigurerade

### API
- [ ] CORS Allowed Origins inkluderar produktionsdomän
- [ ] Rate limits är rimliga (inte för restriktiva)

---

## ✅ Frontend-konfiguration

### Miljövariabler
- [ ] `.env.production` skapad
- [ ] `VITE_SUPABASE_URL` är korrekt
- [ ] `VITE_SUPABASE_ANON_KEY` är korrekt (anon, inte service_role)

### Bygg
- [ ] `npm run build` fungerar utan fel
- [ ] `dist/`-mappen skapas
- [ ] Inga console.log-fel kvar i produktionskod

### Tester
- [ ] Inloggning fungerar
- [ ] Registrering fungerar
- [ ] CV kan sparas/laddas
- [ ] Intresseguide kan sparas
- [ ] Personliga brev kan skapas
- [ ] Jobbsökning fungerar

---

## ✅ Deployment

### Simply
- [ ] Site skapad
- [ ] GitHub-repo kopplat (eller manuell upload)
- [ ] Bygg-kommando konfigurerat
- [ ] Miljövariabler inlagda
- [ ] Custom domain konfigurerad (om aktuellt)

### DNS (om egen domän)
- [ ] CNAME-pekare korrekt
- [ ] SSL-certifikat fungerar
- [ ] Domänen pekar på Simply

---

## ✅ Säkerhet

- [ ] Inga hemligheter i kod/Git
- [ ] Service role key INTE i frontend
- [ ] RLS policies testade
- [ ] HTTPS påtvingat
- [ ] Lösenordskrav rimliga

---

## ✅ Backup & Underhåll

- [ ] Supabase backups aktiverade
- [ ] Återställningsplan dokumenterad
- [ ] Kontakt till support (Simply + Supabase)

---

## 📊 Pre-lanseringstest

### Funktionstest
1. [ ] Skapa nytt konto via registrering
2. [ ] Logga in med nya kontot
3. [ ] Fyll i CV och spara
4. [ ] Gör intresseguiden
5. [ ] Skapa personligt brev
6. [ ] Sök jobb via Arbetsförmedlingen
7. [ ] Spara ett jobb
8. [ ] Logga ut och in igen
9. [ ] Verifiera att all data finns kvar

### Prestandatest
1. [ ] Sidan laddar under 3 sekunder
2. [ ] Auth fungerar snabbt
3. [ ] Jobbsökning är responsiv

### Mobilanpassning
1. [ ] Testa på mobil enhet/emulator
2. [ ] Alla knappar är klickbara
3. [ ] Text är läsbar

---

## 🚀 Go Live

När allt ovan är ✅:

1. **Meddela intressenter**
   - Arbetskonsulenter
   - Testanvändare
   - Stakeholders

2. **Övervakning första veckan**
   - Kolla Supabase logs dagligen
   - Kolla Simply analytics
   - Var beredd på snabb support

3. **Feedback-loop**
   - Samla in användarfeedback
   - Prioritera buggfixar
   - Planera nästa version

---

**Lycka till med lanseringen!** 🎉
