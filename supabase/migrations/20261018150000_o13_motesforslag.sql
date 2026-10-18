-- O13 (spår O / KF fas 2, 2026-10-18): deltagaren föreslår en mötestid, konsulenten bekräftar.
-- Tidigare öppnade "Boka möte" på Min konsulent bara ett mejl ("Bokningsförfrågan").
--
-- Ett förslag är en vanlig rad i consultant_meetings med status 'proposed'. Konsulenten
-- bekräftar (→ 'scheduled') eller tackar nej (→ 'cancelled') med sin BEFINTLIGA rätt
-- (policyn "KS2b: konsulent ändrar bara eget möte"). Ingen ny rätt för konsulenten.
--
-- Deltagaren får: lägga in ett förslag till SIN aktiva konsulent, i framtiden, som förslag
-- (inte ett bokat möte), och dra tillbaka sitt eget förslag så länge det är ett förslag.
-- consultant_participants läses som deltagaren själv ("Deltagare ser sin egen koppling");
-- de policyerna läser inte consultant_meetings, så ingen rekursion (42P17).

alter table public.consultant_meetings drop constraint if exists consultant_meetings_status_check;
alter table public.consultant_meetings add constraint consultant_meetings_status_check
  check (status::text = any (array['scheduled', 'completed', 'cancelled', 'proposed']));

alter table public.consultant_meetings
  add column if not exists proposed_by uuid references auth.users(id) on delete set null,
  add column if not exists proposed_note text check (proposed_note is null or char_length(proposed_note) <= 500);

comment on column public.consultant_meetings.proposed_by is 'O13: den som föreslog tiden (deltagaren). NULL = bokat av konsulenten.';
comment on column public.consultant_meetings.proposed_note is 'O13: deltagarens rad till förslaget, högst 500 tecken.';

drop policy if exists "O13: deltagaren föreslår en tid" on public.consultant_meetings;
create policy "O13: deltagaren föreslår en tid"
  on public.consultant_meetings for insert to authenticated
  with check (
    participant_id = (select auth.uid())
    and proposed_by = (select auth.uid())
    and status = 'proposed'
    and scheduled_at > now()
    and exists (
      select 1 from public.consultant_participants cp
      where cp.participant_id = (select auth.uid())
        and cp.consultant_id = consultant_meetings.consultant_id
    )
  );

drop policy if exists "O13: deltagaren drar tillbaka sitt förslag" on public.consultant_meetings;
create policy "O13: deltagaren drar tillbaka sitt förslag"
  on public.consultant_meetings for delete to authenticated
  using (participant_id = (select auth.uid()) and proposed_by = (select auth.uid()) and status = 'proposed');
