import React, { useState, useCallback, useMemo } from 'react'
import './SpellChecker.css'

// Simplifierad svensk ordlista med vanliga ord i CV-sammanhang
const commonSwedishWords = new Set([
  'jag', 'du', 'han', 'hon', 'den', 'det', 'vi', 'ni', 'de',
  'är', 'var', 'varit', 'vara', 'har', 'hade', 'haft',
  'och', 'eller', 'men', 'för', 'att', 'som', 'med',
  'ett', 'en', 'denna', 'denne', 'dessa',
  'min', 'din', 'hans', 'hennes', 'vår', 'er', 'deras',
  'på', 'i', 'till', 'från', 'av', 'om', 'under', 'över',
  'bra', 'dålig', 'stor', 'liten', 'ny', 'gammal',
  'jobb', 'arbete', 'erfarenhet', 'utbildning', 'skola',
  'kund', 'service', 'försäljning', 'butik', 'kassa',
  'driven', 'engagerad', 'motiverad', 'erfaren',
  'ansvarig', 'ledare', 'team', 'kollega', 'chef',
  'svenska', 'engelska', 'språk', 'kommunikation',
  'dator', 'system', 'program', 'data',
  'år', 'månad', 'vecka', 'dag', 'tid',
  'början', 'slut', 'start', 'avslut',
  'administratör', 'assistent', 'anställd', 'arbetsgivare',
  'arbetsplats', 'arbetsuppgifter', 'arbetstid', 'bakgrund',
  'bemanning', 'beskrivning', 'betalning', 'butiksbiträde',
  'datorkunskaper', 'deltid', 'diplom', 'examensbevis',
  'flexibel', 'företag', 'förmåga', 'försäljare', 'grundskola',
  'gymnasium', 'handläggare', 'heltid', 'intresse', 'kandidatexamen',
  'kassörska', 'kontakt', 'kundbemötande', 'kundtjänst',
  'lager', 'lagerarbetare', 'lärare', 'löneanspråk',
  'magisterexamen', 'marknadsföring', 'masterexamen',
  'meriterande', 'möjlighet', 'novisch', 'personal',
  'personlig', 'personlighet', 'praktik', 'praktisk',
  'problemlösning', 'projekt', 'projektledare', 'referens',
  'rekrytering', 'restaurang', 'säljare', 'sammanfattning',
  'samarbete', 'samtal', 'samtida', 'sökande', 'specifik',
  'språkkunskaper', 'telefon', 'tillsvidare', 'tjänst',
  'tjänstledig', 'trevlig', 'universitet', 'värdering',
  'vattenkänd', 'villig', 'visdom', 'vuxen', 'yrke',
  'yrkesliv', 'yrkesmässig', 'önskvärd', 'öppen',
])

// Vanliga engelska ord för CV
const commonEnglishWords = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'am', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
  'and', 'or', 'but', 'for', 'to', 'that', 'with', 'the', 'a', 'an',
  'my', 'your', 'his', 'her', 'our', 'their', 'this', 'these', 'those',
  'on', 'in', 'at', 'from', 'of', 'about', 'under', 'over', 'into',
  'good', 'bad', 'big', 'small', 'new', 'old', 'high', 'low',
  'job', 'work', 'experience', 'education', 'school', 'university',
  'customer', 'service', 'sales', 'store', 'cashier',
  'driven', 'engaged', 'motivated', 'experienced',
  'responsible', 'leader', 'team', 'colleague', 'manager',
  'swedish', 'english', 'language', 'communication',
  'computer', 'system', 'program', 'data', 'software',
  'year', 'month', 'week', 'day', 'time', 'period',
  'beginning', 'end', 'start', 'finish',
  'administrator', 'assistant', 'employee', 'employer',
  'workplace', 'tasks', 'hours', 'background',
  'staffing', 'description', 'payment', 'retail',
  'computer skills', 'part-time', 'diploma', 'certificate',
  'flexible', 'company', 'ability', 'seller', 'primary school',
  'high school', 'handler', 'full-time', 'interest', 'bachelor',
  'cashier', 'contact', 'customer service', 'warehouse',
  'warehouse worker', 'teacher', 'salary expectation',
  'master', 'marketing', 'meritorious', 'opportunity',
  'novice', 'personnel', 'personal', 'personality',
  'internship', 'practical', 'problem solving', 'project',
  'project manager', 'reference', 'recruitment', 'restaurant',
  'salesperson', 'summary', 'cooperation', 'conversation',
  'applicant', 'specific', 'language skills', 'phone',
  'permanent', 'position', 'leave', 'friendly', 'willing',
  'professional', 'career', 'desired', 'open',
])

interface SpellingError {
  word: string
  index: number
  suggestions: string[]
}

interface SpellCheckerProps {
  text: string
  onCorrect: (correctedText: string) => void
  language?: 'sv' | 'en'
}

// Beräkna Levenshtein-avstånd (edit distance)
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }

  return dp[m][n]
}

// Hitta förslag på rättstavning
const getSuggestions = (word: string, wordList: Set<string>, maxSuggestions = 3): string[] => {
  const suggestions: { word: string; distance: number }[] = []

  for (const dictWord of wordList) {
    const distance = levenshteinDistance(word.toLowerCase(), dictWord)
    // Endast förslag inom rimligt avstånd
    if (distance <= 3 && distance > 0) {
      suggestions.push({ word: dictWord, distance })
    }
  }

  // Sortera efter avstånd och returnera de bästa förslagen
  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(s => s.word)
}

export const SpellChecker: React.FC<SpellCheckerProps> = ({
  text,
  onCorrect,
  language = 'sv'
}) => {
  const [errors, setErrors] = useState<SpellingError[]>([])
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set())
  const [showDetails, setShowDetails] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null)

  const wordList = useMemo(() => 
    language === 'sv' ? commonSwedishWords : commonEnglishWords,
  [language])

  const checkSpelling = useCallback(() => {
    const words = text.match(/\b[\wåäöÅÄÖéÉüÜ]+\b/g) || []
    const foundErrors: SpellingError[] = []
    const seenWords = new Set<string>()

    words.forEach((word, index) => {
      const lowerWord = word.toLowerCase()
      
      // Hoppa över ord som redan kontrollerats eller ignorerats
      if (seenWords.has(lowerWord) || ignoredWords.has(lowerWord)) return
      seenWords.add(lowerWord)

      // Kontrollera om ordet finns i ordlistan
      if (!wordList.has(lowerWord)) {
        // Kontrollera om det är ett nummer
        if (!/^\d+$/.test(word)) {
          const suggestions = getSuggestions(lowerWord, wordList)
          foundErrors.push({
            word,
            index,
            suggestions
          })
        }
      }
    })

    setErrors(foundErrors)
    setShowDetails(true)
  }, [text, wordList, ignoredWords])

  const applyCorrection = (originalWord: string, correction: string) => {
    const newText = text.replace(
      new RegExp(`\\b${originalWord}\\b`, 'gi'),
      correction
    )
    onCorrect(newText)
    
    // Ta bort felet från listan
    setErrors(prev => prev.filter(e => e.word !== originalWord))
  }

  const ignoreWord = (word: string) => {
    setIgnoredWords(prev => new Set(prev).add(word.toLowerCase()))
    setErrors(prev => prev.filter(e => e.word !== word))
  }

  const ignoreAll = () => {
    const newIgnored = new Set(ignoredWords)
    errors.forEach(e => newIgnored.add(e.word.toLowerCase()))
    setIgnoredWords(newIgnored)
    setErrors([])
  }

  const renderTextWithHighlights = () => {
    if (errors.length === 0) {
      return <span className="spell-checker-text">{text}</span>
    }

    const errorWords = new Set(errors.map(e => e.word.toLowerCase()))
    const parts = text.split(/(\b[\wåäöÅÄÖéÉüÜ]+\b)/g)

    return (
      <span className="spell-checker-text">
        {parts.map((part, index) => {
          const isError = errorWords.has(part.toLowerCase())
          const error = errors.find(e => e.word.toLowerCase() === part.toLowerCase())
          
          if (isError && error) {
            return (
              <span
                key={index}
                className="spell-checker-error"
                onMouseEnter={() => setActiveTooltip(index)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                {part}
                {activeTooltip === index && error.suggestions.length > 0 && (
                  <span className="spell-checker-tooltip">
                    <span className="tooltip-title">Förslag:</span>
                    {error.suggestions.map((suggestion, sIndex) => (
                      <button
                        key={sIndex}
                        className="tooltip-suggestion"
                        onClick={() => applyCorrection(error.word, suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </span>
                )}
              </span>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </span>
    )
  }

  return (
    <div className="spell-checker">
      <div className="spell-checker-header">
        <button 
          className="spell-checker-button"
          onClick={checkSpelling}
        >
          🔍 Kontrollera stavning
        </button>
        
        {errors.length > 0 && (
          <span className="spell-checker-status error">
            ⚠️ Hittade {errors.length} fel
          </span>
        )}
        
        {errors.length === 0 && showDetails && (
          <span className="spell-checker-status success">
            ✅ Inga fel hittades
          </span>
        )}
      </div>

      <div className="spell-checker-content">
        {renderTextWithHighlights()}
      </div>

      {showDetails && errors.length > 0 && (
        <div className="spell-checker-details">
          <div className="details-header">
            <h4>Felstavade ord:</h4>
            <button 
              className="ignore-all-button"
              onClick={ignoreAll}
            >
              Ignorera alla
            </button>
          </div>
          
          <ul className="error-list">
            {errors.map((error, index) => (
              <li key={index} className="error-item">
                <span className="error-word">"{error.word}"</span>
                
                {error.suggestions.length > 0 ? (
                  <span className="suggestions">
                    <span className="suggestions-label">Förslag:</span>
                    {error.suggestions.map((suggestion, sIndex) => (
                      <button
                        key={sIndex}
                        className="suggestion-button"
                        onClick={() => applyCorrection(error.word, suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </span>
                ) : (
                  <span className="no-suggestions">Inga förslag</span>
                )}
                
                <button 
                  className="ignore-button"
                  onClick={() => ignoreWord(error.word)}
                >
                  Ignorera
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SpellChecker
