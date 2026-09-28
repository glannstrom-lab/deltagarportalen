-- SL1 (skarpt test 2026-09-28): "Föreslå deltagaren för företaget" gick att skicka två
-- gånger för samma placering — deltagaren fick två identiska frågor. Knappen döljs nu i
-- PlatserTab när ett väntande förslag finns; indexet gör det omöjligt även vid dubbelklick
-- eller två flikar. Ett besvarat/återkallat förslag hindrar inte ett nytt.
CREATE UNIQUE INDEX IF NOT EXISTS employer_share_proposals_ett_vantande_per_placering
  ON public.employer_share_proposals (placement_id)
  WHERE status = 'pending';
