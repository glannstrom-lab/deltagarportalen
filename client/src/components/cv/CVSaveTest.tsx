/**
 * Testkomponent för att diagnostisera CV-sparningsproblem
 * Visar knappar för att testa olika delar av sparflödet
 */

import { useState } from 'react'
import { cvApi } from '@/services/supabaseApi'
import { useAuthStore } from '@/stores/authStore'

export function CVSaveTest() {
  const { user } = useAuthStore()
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (msg: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const test1_SaveAndLoad = async () => {
    setLoading(true)
    addResult('=== TEST 1: Spara och ladda ===')
    
    try {
      // 1. Skapa testdata med 3 jobb
      const testData = {
        firstName: 'Test',
        lastName: 'Testsson',
        workExperience: [
          { id: '1', company: 'Företag 1', title: 'Jobb 1', startDate: '2020-01', current: false },
          { id: '2', company: 'Företag 2', title: 'Jobb 2', startDate: '2021-01', current: false },
          { id: '3', company: 'Företag 3', title: 'Jobb 3', startDate: '2022-01', current: true },
        ]
      }
      
      addResult(`Sparar ${testData.workExperience.length} jobb...`)
      
      // 2. Spara
      await cvApi.updateCV(testData)
      addResult('✓ Sparat till Supabase')
      
      // 3. Vänta lite
      await new Promise(r => setTimeout(r, 500))
      
      // 4. Ladda tillbaka
      const loaded = await cvApi.getCV()
      addResult(`✓ Laddat från Supabase: ${loaded?.workExperience?.length || 0} jobb`)
      
      // 5. Jämför
      if (loaded?.workExperience?.length === testData.workExperience.length) {
        addResult('✅ SUCCESS: Antal jobb matchar!')
      } else {
        addResult(`❌ FAIL: Förväntade ${testData.workExperience.length}, fick ${loaded?.workExperience?.length || 0}`)
      }
      
    } catch (err: any) {
      addResult(`❌ ERROR: ${err.message}`)
    }
    
    setLoading(false)
  }

  const test2_CheckRawData = async () => {
    setLoading(true)
    addResult('=== TEST 2: Kolla rådata i databasen ===')
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase
        .from('cvs')
        .select('work_experience, updated_at')
        .single()
      
      if (error) {
        addResult(`❌ Supabase error: ${error.message}`)
      } else {
        addResult(`✓ Rådata från DB:`)
        addResult(`  - work_experience: ${JSON.stringify(data.work_experience)?.substring(0, 100)}...`)
        addResult(`  - count: ${data.work_experience?.length || 0}`)
        addResult(`  - updated_at: ${data.updated_at}`)
      }
    } catch (err: any) {
      addResult(`❌ ERROR: ${err.message}`)
    }
    
    setLoading(false)
  }

  const test3_ClearWorkExperience = async () => {
    setLoading(true)
    addResult('=== TEST 3: Rensa alla jobb ===')
    
    try {
      await cvApi.updateCV({ workExperience: [] })
      addResult('✓ Skickade tom workExperience-array')
      
      await new Promise(r => setTimeout(r, 500))
      
      const loaded = await cvApi.getCV()
      addResult(`✓ Efter reload: ${loaded?.workExperience?.length || 0} jobb`)
      
      if ((loaded?.workExperience?.length || 0) === 0) {
        addResult('✅ SUCCESS: Tömdes korrekt!')
      } else {
        addResult('❌ FAIL: Jobb finns fortfarande kvar!')
      }
    } catch (err: any) {
      addResult(`❌ ERROR: ${err.message}`)
    }
    
    setLoading(false)
  }

  if (!user) {
    return <div className="p-4 bg-amber-50 text-amber-700">Logga in först</div>
  }

  return (
    <div className="p-6 bg-white rounded-xl border-2 border-slate-200 space-y-4">
      <h2 className="text-xl font-bold text-slate-800">CV-spar test</h2>
      <p className="text-sm text-slate-500">
        User ID: <code className="bg-slate-100 px-2 py-1 rounded">{user.id}</code>
      </p>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={test1_SaveAndLoad}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Test 1: Spara 3 jobb & ladda
        </button>
        
        <button
          onClick={test2_CheckRawData}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Test 2: Kolla rådata i DB
        </button>
        
        <button
          onClick={test3_ClearWorkExperience}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          Test 3: Rensa alla jobb
        </button>
        
        <button
          onClick={() => setResults([])}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
        >
          Rensa resultat
        </button>
      </div>
      
      <div className="mt-4 p-4 bg-slate-50 rounded-lg font-mono text-sm space-y-1 max-h-80 overflow-y-auto">
        {results.length === 0 ? (
          <span className="text-slate-400">Klicka på en knapp för att testa...</span>
        ) : (
          results.map((r, i) => (
            <div key={i} className={
              r.includes('❌') ? 'text-red-600' :
              r.includes('✅') ? 'text-green-600 font-bold' :
              r.includes('✓') ? 'text-green-600' :
              'text-slate-700'
            }>
              {r}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
