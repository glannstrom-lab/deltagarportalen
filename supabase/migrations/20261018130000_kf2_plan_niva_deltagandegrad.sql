-- KF2 (spår KF, 2026-10-18): grundersättningen i Rusta och matcha 2 räknas per deltagare och
-- vardag efter AF:s nivå (A 55 / B 70 / C 90 kr) och sänks till 80 % vid anvisning under 100 %
-- (FFU Af-2025/0017 v3 §5.1). Planen saknade båda uppgifterna. Nivån sätts av AF och ändras inte
-- under placeringen; konsulenten skriver av den ur beslutet. Båda kolumnerna är valfria — saknas
-- de visar underlaget "—", aldrig ett gissat belopp.
--
-- Skrivs genom den befintliga policyn "Konsulent har access till aktiva deltagares aktivitetsplan"
-- (ALL för egen konsulent). Ingen ny policy, inga nya rättigheter.
alter table public.activity_plans
  add column if not exists rom_niva text check (rom_niva in ('A', 'B', 'C')),
  add column if not exists deltagandegrad smallint check (deltagandegrad between 1 and 100);

comment on column public.activity_plans.rom_niva is 'Rusta och matcha: AF:s nivå A/B/C för deltagaren (ur beslutet). KF2.';
comment on column public.activity_plans.deltagandegrad is 'Rusta och matcha: anvisad deltagandegrad i procent. Under 100 ger 80 % grundersättning. KF2.';
