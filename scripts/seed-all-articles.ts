/**
 * Seed alla mockArticlesData (146 artiklar) till Supabase articles-tabellen.
 *
 * Kör: npx tsx scripts/seed-all-articles.ts
 *
 * Kräver:
 *   VITE_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY i client/.env.production.local
 *
 * Använder ON CONFLICT (slug) DO UPDATE — idempotent. Befintliga seedrader
 * uppdateras med mockdata, nya skapas. Kör flera gånger utan duplikering.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Hämta env från client/.env.production.local
const envFile = readFileSync('client/.env.production.local', 'utf-8')
const env: Record<string, string> = {}
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(?:"([^"]*)"|(.*))$/)
  if (m) env[m[1]] = (m[2] ?? m[3] ?? '').trim()
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in client/.env.production.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function main() {
// Importera mockdatan från source — tsx kompilerar TS on-the-fly
const { mockArticlesData } = await import('../client/src/services/articleData.ts')

console.log(`Seedar ${mockArticlesData.length} artiklar till Supabase...`)

let success = 0
let failed = 0
const errors: string[] = []

for (let i = 0; i < mockArticlesData.length; i++) {
  const a = mockArticlesData[i]
  const row = {
    slug: a.id,
    title: a.title,
    summary: a.summary || '',
    content: a.content || '',
    category_key: a.category || null,
    subcategory: a.subcategory || null,
    tags: Array.isArray(a.tags) ? a.tags : (a.tags ? [a.tags] : []),
    reading_time: a.readingTime || 5,
    difficulty: a.difficulty || 'medium',
    energy_level: a.energyLevel || 'medium',
    related_article_slugs: a.relatedArticles || [],
    related_exercise_slugs: a.relatedExercises || [],
    related_tools: a.relatedTools || [],
    checklist: a.checklist || [],
    actions: a.actions || [],
    author: a.author || null,
    author_title: a.authorTitle || null,
    is_active: true,
    sort_order: (i + 1) * 10,
  }

  const { error } = await supabase
    .from('articles')
    .upsert(row, { onConflict: 'slug' })

  if (error) {
    failed++
    errors.push(`${a.id}: ${error.message}`)
    if (failed <= 5) console.error(`  ✗ ${a.id}: ${error.message}`)
  } else {
    success++
    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${mockArticlesData.length}...`)
  }
}

console.log(`\n=== Klart ===`)
console.log(`✅ ${success} upsertade`)
console.log(`❌ ${failed} misslyckade`)
if (errors.length > 0 && errors.length <= 20) {
  console.log('\nFel:')
  errors.forEach(e => console.log(`  ${e}`))
}
}

main().catch(e => { console.error(e); process.exit(1) })
