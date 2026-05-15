/**
 * Verifiera att alla relatedArticles- och relatedExercises-referenser i
 * articleData.ts pekar på existerande IDs.
 *
 * Kör: node scripts/verify-article-refs.cjs
 */

const fs = require('fs')

const articleSrc = fs.readFileSync('client/src/services/articleData.ts', 'utf-8')
const exerciseSrc = fs.readFileSync('client/src/data/exercises.ts', 'utf-8')

// Extrahera alla artikel-IDs (id: 'xyz')
const articleIds = new Set([...articleSrc.matchAll(/^\s*id:\s*'([^']+)'/gm)].map(m => m[1]))
const exerciseIds = new Set([...exerciseSrc.matchAll(/^\s*id:\s*'([^']+)'/gm)].map(m => m[1]))

console.log(`Artiklar: ${articleIds.size}, Övningar: ${exerciseIds.size}\n`)

// Extrahera alla relatedArticles- och relatedExercises-arrayer (med sin omgivande artikel-id)
const articleBlocks = articleSrc.split(/\n  \{\n/)
const brokenArticleRefs = new Map()  // articleId → [missing refs]
const brokenExerciseRefs = new Map()
let totalArticleRefs = 0
let totalExerciseRefs = 0

for (const block of articleBlocks) {
  const idMatch = block.match(/^\s*id:\s*'([^']+)'/m)
  if (!idMatch) continue
  const articleId = idMatch[1]

  // relatedArticles: ['a', 'b', 'c']
  const raMatch = block.match(/relatedArticles:\s*\[([^\]]*)\]/m)
  if (raMatch) {
    const refs = [...raMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1])
    totalArticleRefs += refs.length
    const broken = refs.filter(r => !articleIds.has(r))
    if (broken.length > 0) brokenArticleRefs.set(articleId, broken)
  }

  // relatedExercises: ['a', 'b']
  const reMatch = block.match(/relatedExercises:\s*\[([^\]]*)\]/m)
  if (reMatch) {
    const refs = [...reMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1])
    totalExerciseRefs += refs.length
    const broken = refs.filter(r => !exerciseIds.has(r))
    if (broken.length > 0) brokenExerciseRefs.set(articleId, broken)
  }
}

console.log(`relatedArticles refs: ${totalArticleRefs} totalt, ${[...brokenArticleRefs.values()].flat().length} brutna`)
console.log(`relatedExercises refs: ${totalExerciseRefs} totalt, ${[...brokenExerciseRefs.values()].flat().length} brutna\n`)

if (brokenArticleRefs.size > 0) {
  console.log('=== BRUTNA relatedArticles ===')
  for (const [aid, refs] of brokenArticleRefs) {
    console.log(`  ${aid}: ${refs.join(', ')}`)
  }
  console.log()
}

if (brokenExerciseRefs.size > 0) {
  console.log('=== BRUTNA relatedExercises ===')
  for (const [aid, refs] of brokenExerciseRefs) {
    console.log(`  ${aid}: ${refs.join(', ')}`)
  }
}

// Spara rapporten
const report = {
  totals: { articles: articleIds.size, exercises: exerciseIds.size, articleRefs: totalArticleRefs, exerciseRefs: totalExerciseRefs },
  brokenArticleRefs: Object.fromEntries(brokenArticleRefs),
  brokenExerciseRefs: Object.fromEntries(brokenExerciseRefs),
}
fs.writeFileSync('article-refs-report.json', JSON.stringify(report, null, 2))
console.log('\nRapport: article-refs-report.json')
