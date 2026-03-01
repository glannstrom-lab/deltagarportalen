# 🔧 Fixa invitations-tabellen

## Problem
Migrationen för `invitations` tabellen kördes inte färdigt pga ett trigger-fel.

## Lösning

### Steg 1: Gå till SQL Editor
1. Öppna: https://supabase.com/dashboard/project/odcvrdkvzyrbdzvdrhkz/sql/new
2. Kopiera SQL-koden nedan
3. Klicka "Run"

### Steg 2: Kör denna SQL

```sql
-- ============================================
-- FIX: Skapa invitations tabell
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'CONSULTANT', 'ADMIN')),
  invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_consultant ON invitations(consultant_id);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Consultants can view their own invitations" 
  ON invitations FOR SELECT USING (auth.uid() = invited_by);

CREATE POLICY IF NOT EXISTS "Consultants can create invitations" 
  ON invitations FOR INSERT WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CONSULTANT', 'ADMIN', 'SUPERADMIN'))
  );

CREATE POLICY IF NOT EXISTS "Consultants can update their own invitations" 
  ON invitations FOR UPDATE USING (auth.uid() = invited_by);
```

### Steg 3: Verifiera
Gå till: https://supabase.com/dashboard/project/odcvrdkvzyrbdzvdrhkz/database/tables

Kolla att `invitations` tabellen finns nu!

---

## Alternativ: Kör från fil

Om du vill kan du också köra filen direkt:

```bash
# Kör SQL-filen
psql -h db.odcvrdkvzyrbdzvdrhkz.supabase.co -U postgres -d postgres -f fix-invitations.sql
```

Eller kopiera innehållet från `fix-invitations.sql` och kör i SQL Editor.

---

## ✅ Efteråt

När tabellen finns:
1. Sätt miljövariabler i Dashboard (om du inte redan gjort)
2. Testa att bjuda in en deltagare som konsulent
