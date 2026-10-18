-- KF5 (spår KF, 2026-10-18): deltagaren bekräftar att hen har läst sin aktivitetsplan.
--
-- Wundermatch har digital signering av handlingsplaner. Det här är INTE en signatur
-- (det kräver BankID, O20) utan en kvittens med tidsstämpel och planversion:
-- "jag har läst min plan". Ändrar konsulenten planen efteråt syns det, eftersom
-- bekräftelsen bär den `updated_at` planen hade när den lästes.
--
-- Egen tabell, inte kolumner på activity_plans: en kolumn hade bumpat planens
-- updated_at via trg_activity_plans_updated_at, och då hade bekräftelsen alltid
-- pekat på en version som inte längre fanns.
--
-- Bara INSERT och SELECT. Ingen UPDATE eller DELETE — en kvittens skrivs inte om.
-- Raderna följer planen (ON DELETE CASCADE) och kontot (auth.users, CASCADE — samma som activity_plans) i gallringen.

create table if not exists public.activity_plan_confirmations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.activity_plans(id) on delete cascade,
  participant_id uuid not null references auth.users(id) on delete cascade,
  plan_updated_at timestamptz not null,
  confirmed_at timestamptz not null default now()
);

create index if not exists activity_plan_confirmations_plan_idx
  on public.activity_plan_confirmations (plan_id, confirmed_at desc);

alter table public.activity_plan_confirmations enable row level security;

-- Läsa: den som får läsa planen får läsa dess bekräftelser. Underfrågan går
-- genom activity_plans egen RLS (deltagaren, konsulenten, organisationens chef),
-- och activity_plans policyer läser inte den här tabellen — ingen rekursion (42P17).
drop policy if exists "Den som ser planen ser bekräftelsen" on public.activity_plan_confirmations;
create policy "Den som ser planen ser bekräftelsen"
  on public.activity_plan_confirmations for select to authenticated
  using (exists (select 1 from public.activity_plans p where p.id = plan_id));

-- Skriva: bara deltagaren själv, bara sin egen AKTIVA plan, bara den version som
-- gäller just nu, och med en tidsstämpel som är nu (inte bakdaterad).
drop policy if exists "Deltagaren bekräftar sin aktiva plan" on public.activity_plan_confirmations;
create policy "Deltagaren bekräftar sin aktiva plan"
  on public.activity_plan_confirmations for insert to authenticated
  with check (
    participant_id = (select auth.uid())
    and confirmed_at between now() - interval '5 minutes' and now() + interval '1 minute'
    and exists (
      select 1 from public.activity_plans p
      where p.id = plan_id
        and p.participant_id = (select auth.uid())
        and p.status = 'active'
        and p.updated_at = plan_updated_at
    )
  );

revoke all on public.activity_plan_confirmations from anon;
revoke all on public.activity_plan_confirmations from public;
grant select, insert on public.activity_plan_confirmations to authenticated;

-- Supabase ger nya tabeller standardrättigheter till authenticated (och anon); en
-- REVOKE FROM public tar inte bort dem. Mätt efter första körningen:
-- has_table_privilege('authenticated', …, 'UPDATE') = true. Explicit:
revoke update, delete, truncate, references, trigger on public.activity_plan_confirmations from authenticated;
revoke all on public.activity_plan_confirmations from anon;
