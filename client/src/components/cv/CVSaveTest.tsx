/**
 * Diagnostik-komponent för CV-sparningsproblem
 * Visar om allt är OK eller vad som behöver fixas
 */

import { useState, useEffect } from 'react'
import { cvApi } from '@/services/supabaseApi'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export function CVSaveTest() {
  const { user } = useAuthStore()
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<string[]>([])

  const runDiagnostic = async () => {
    setStatus('testing')
    setDetails([])
    const logs: string[] = []

    try {
      // Test 1: Spara 3 jobb
      logs.push('📝 Test 1: Sparar 3 test-jobb...')
      const testData = {
        firstName: 'Test',
        lastName: 'Testsson',
        workExperience: [
          { id: '1', company: 'Företag A', title: 'Jobb 1', startDate: '2020-01' },
          { id: '2', company: 'Företag B', title: 'Jobb 2', startDate: '2021-01' },
          { id: '3', company: 'Företag C', title: 'Jobb 3', startDate: '2022-01' },
        ]
      }
      
      await cvApi.updateCV(testData)
      logs.push('✅ Sparat till Supabase')

      // Test 2: Vänta och ladda
      logs.push('⏳ Väntar 1 sekund...')
      await new Promise(r => setTimeout(r, 1000))
      
      logs.push('📥 Laddar tillbaka data...')
      const loaded = await cvApi.getCV()
      const loadedCount = loaded?.workExperience?.length || 0
      logs.push(`📊 Laddade ${loadedCount} jobb`)

      // Test 3: Jämför
      if (loadedCount === 3) {
        setStatus('ok')
        setMessage('✅ Allt fungerar! Dina CV:n sparas korrekt.')
        logs.push('✅ TEST KLART: Sparning fungerar!')
      } else {
        setStatus('error')
        setMessage(`❌ Problem! Sparade 3 jobb men fick ${loadedCount}.`)
        logs.push('❌ TEST FAILED: Data sparas inte korrekt')
        
        // Försök diagnostisera problemet
        logs.push('')
        logs.push('🔍 Försöker diagnostisera...')
        
        // Kolla direkt i databasen
        const { data: rawData, error } = await supabase
          .from('cvs')
          .select('work_experience')
          .single()
        
        if (error) {
          logs.push(`❌ Supabase error: ${error.message}`)
          logs.push('💡 Tips: Kör SQL-filen 20260316_fix_cv_save_issues.sql i Supabase')
        } else {
          const rawCount = rawData?.work_experience?.length || 0
          logs.push(`📊 Rådata i DB: ${rawCount} jobb`)
          
          if (rawCount === 0) {
            logs.push('💡 Problem: work_experience är tom i databasen')
            logs.push('💡 Lösning: Kör SQL-filen 20260316_fix_cv_save_issues.sql')
          } else if (rawCount === loadedCount) {
            logs.push('💡 Problem: Datan sparas men laddas inte korrekt')
          } else {
            logs.push('💡 Problem: Inkonsistent data mellan spara/ladda')
          }
        }
      }

      // Cleanup: Rensa testdata
      logs.push('')
      logs.push('🧹 Rensar testdata...')
      await cvApi.updateCV({ workExperience: [] })
      logs.push('✅ Testdata borttaget')

    } catch (err) {
      setStatus('error')
      setMessage('❌ Fel vid test')
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel'
      logs.push(`❌ ERROR: ${errorMessage}`)
      logs.push('💡 Tips: Kolla att du är inloggad och har nätverk')
    }

    setDetails(logs)
  }

  if (!user) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-amber-800">⚠️ Logga in för att testa CV-sparning</p>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white rounded-xl border-2 border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-2">CV-spar test</h3>
      <p className="text-sm text-slate-700 mb-4">
        Klicka för att testa om arbetslivserfarenhet sparas korrekt.
      </p>

      <button
        onClick={runDiagnostic}
        disabled={status === 'testing'}
        className={`
          w-full py-3 px-4 rounded-xl font-medium transition-all
          ${status === 'testing' 
            ? 'bg-slate-100 text-slate-600 cursor-wait' 
            : status === 'ok'
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : status === 'error'
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {status === 'testing' ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> Testar...
          </span>
        ) : status === 'idle' ? (
          '🔍 Kör diagnostik'
        ) : (
          message
        )}
      </button>

      {details.length > 0 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs font-mono space-y-1 max-h-60 overflow-y-auto">
          {details.map((log, i) => (
            <div 
              key={i} 
              className={
                log.includes('❌') ? 'text-rose-600' :
                log.includes('✅') ? 'text-emerald-600' :
                log.includes('💡') ? 'text-blue-600 font-medium' :
                'text-slate-600'
              }
            >
              {log}
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-medium text-amber-800 mb-2">🛠️ Så här fixar du det:</p>
          <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
            <li>Gå till <a href="https://app.supabase.com" target="_blank" className="underline">Supabase Dashboard</a></li>
            <li>Välj ditt projekt → SQL Editor</li>
            <li>Kör filen: <code className="bg-amber-100 px-1 rounded">20260316_fix_cv_save_issues.sql</code></li>
            <li>Ladda om denna sida och testa igen</li>
          </ol>
        </div>
      )}
    </div>
  )
}
