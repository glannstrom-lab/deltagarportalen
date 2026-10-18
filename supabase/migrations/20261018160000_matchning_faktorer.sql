-- Matchning med valbara faktorer (beslut Mikael 2026-10-18: "skippa flera olika matchningar,
-- bättre att välja faktorer"). Deltagarens kryss sparas på kontot så att de följer med mellan
-- enheter: {"av": ["intresseguiden", "korkort", ...]} — en lista över BORTVALDA faktorer, så att
-- en faktor som tillkommer senare är påslagen som standard.
--
-- Skrivs genom user_preferences befintliga RLS (användaren äger sin egen rad). Ingen ny policy.
alter table public.user_preferences
  add column if not exists matchning_faktorer jsonb;

comment on column public.user_preferences.matchning_faktorer is 'Matchningens bortvalda faktorer, {"av": [faktor-id]}. Se client/src/services/matchning.ts.';
