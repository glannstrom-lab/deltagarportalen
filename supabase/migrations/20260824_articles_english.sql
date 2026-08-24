-- Engelsk översättning av kunskapsbankens artiklar.
--
-- Additivt och reversibelt: svenskan ligger kvar orörd i title/summary/content.
-- Kolumnerna är nullbara med flit — en artikel utan översättning faller
-- tillbaka på svenska i `contentApi`, i stället för att visa en tom sida.
-- Det gör också att nya artiklar kan publiceras på svenska först.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS title_en   text,
  ADD COLUMN IF NOT EXISTS summary_en text,
  ADD COLUMN IF NOT EXISTS content_en text;

COMMENT ON COLUMN articles.title_en   IS 'Engelsk titel. NULL = ingen översättning, faller tillbaka på title.';
COMMENT ON COLUMN articles.summary_en IS 'Engelsk sammanfattning. NULL = faller tillbaka på summary.';
COMMENT ON COLUMN articles.content_en IS 'Engelsk brödtext (markdown). NULL = faller tillbaka på content.';
