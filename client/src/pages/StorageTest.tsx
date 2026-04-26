import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Check, X, AlertCircle, Upload, Image as ImageIcon } from '@/components/ui/icons'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  details?: string
}

export default function StorageTest() {
  const { user } = useAuthStore()
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Supabase-anslutning', status: 'pending', message: 'Väntar...' },
    { name: 'Storage-bucket "cv-images"', status: 'pending', message: 'Väntar...' },
    { name: 'Ladda upp testbild', status: 'pending', message: 'Väntar...' },
    { name: 'Hämta publik URL', status: 'pending', message: 'Väntar...' },
    { name: 'Ta bort testbild', status: 'pending', message: 'Väntar...' },
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [testImage, setTestImage] = useState<string | null>(null)

  const updateResult = (index: number, status: TestResult['status'], message: string, details?: string) => {
    setResults(prev => {
      const newResults = [...prev]
      newResults[index] = { ...newResults[index], status, message, details }
      return newResults
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setTestImage(null)

    // Test 1: Supabase-anslutning
    updateResult(0, 'running', 'Testar anslutning...')
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) {
        updateResult(0, 'error', 'Inte inloggad', 'Du måste vara inloggad för att testa Storage')
        setIsRunning(false)
        return
      }
      updateResult(0, 'success', 'Ansluten!', `Inloggad som: ${session.user.email}`)
    } catch (err) {
      updateResult(0, 'error', 'Anslutning misslyckades', err instanceof Error ? err.message : String(err))
      setIsRunning(false)
      return
    }

    // Test 2: Storage-bucket finns
    updateResult(1, 'running', 'Kollar om bucket finns...')
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      if (error) throw error
      
      const cvBucket = buckets.find(b => b.name === 'cv-images')
      if (!cvBucket) {
        updateResult(1, 'error', 'Bucket "cv-images" saknas!', 
          'Gå till Supabase Dashboard → Storage → New bucket → Name: cv-images → Public: true')
        setIsRunning(false)
        return
      }
      
      if (!cvBucket.public) {
        updateResult(1, 'error', 'Bucket finns men är INTE publik!', 
          'Gå till Storage → cv-images → Settings → Public bucket: true')
        setIsRunning(false)
        return
      }
      
      updateResult(1, 'success', 'Bucket finns!', `Name: ${cvBucket.name}, Public: ${cvBucket.public}`)
    } catch (err) {
      updateResult(1, 'error', 'Kunde inte lista buckets', err instanceof Error ? err.message : String(err))
      setIsRunning(false)
      return
    }

    // Test 3: Ladda upp testbild
    updateResult(2, 'running', 'Laddar upp testbild...')
    try {
      // Skapa en enkel testbild (1x1 pixel röd bild)
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(0, 0, 100, 100)
        ctx.fillStyle = 'white'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('TEST', 50, 55)
      }
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png')
      })

      const testPath = `test/${Date.now()}-test.png`
      const { error: uploadError } = await supabase.storage
        .from('cv-images')
        .upload(testPath, blob, { contentType: 'image/png' })

      if (uploadError) {
        const errorMessage = uploadError.message || String(uploadError)
        if (errorMessage.includes('row-level security') || errorMessage.includes('violates')) {
          throw new Error(`RLS Policy fel: ${errorMessage}\n\nLösning: Gå till Storage → cv-images → Policies och skapa INSERT-policy för authenticated users`)
        }
        throw uploadError
      }

      updateResult(2, 'success', 'Uppladdning lyckades!', `Path: ${testPath}`)
      
      // Test 4: Hämta publik URL
      updateResult(3, 'running', 'Hämtar publik URL...')
      const { data: { publicUrl } } = supabase.storage
        .from('cv-images')
        .getPublicUrl(testPath)
      
      setTestImage(publicUrl)
      updateResult(3, 'success', 'URL genererad!', publicUrl)
      
      // Test 5: Ta bort testbild
      updateResult(4, 'running', 'Tar bort testbild...')
      const { error: deleteError } = await supabase.storage
        .from('cv-images')
        .remove([testPath])
      
      if (deleteError) {
        const errorMessage = deleteError.message || String(deleteError)
        if (errorMessage.includes('row-level security')) {
          updateResult(4, 'error', `RLS Policy fel: ${errorMessage}\n\nLösning: Gå till Storage → cv-images → Policies och skapa DELETE-policy`, '')
        } else {
          throw deleteError
        }
      } else {
        updateResult(4, 'success', 'Borttagning lyckades!', '')
      }
      
    } catch (err) {
      updateResult(2, 'error', 'Uppladdning misslyckades', err instanceof Error ? err.message : String(err))
      setIsRunning(false)
      return
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Check className="w-6 h-6 text-brand-700" />
      case 'error': return <X className="w-6 h-6 text-red-500" />
      case 'running': return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      default: return <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
    }
  }

  const allSuccess = results.every(r => r.status === 'success')
  const hasErrors = results.some(r => r.status === 'error')

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">🧪 Storage-test</h1>
        <p className="text-slate-600 mb-6">
          Testar om Supabase Storage är korrekt konfigurerat för CV-bilder.
        </p>

        {/* User info */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-slate-200">
          <p className="text-sm text-slate-700">Inloggad användare:</p>
          <p className="font-medium text-slate-800">{user?.email || 'Inte inloggad'}</p>
          <p className="text-xs text-slate-600 mt-1">User ID: {user?.id || 'N/A'}</p>
        </div>

        {/* Run button */}
        <button
          onClick={runTests}
          disabled={isRunning}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white py-3 px-6 rounded-xl font-semibold mb-8 flex items-center justify-center gap-2 transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Kör tester...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Kör tester
            </>
          )}
        </button>

        {/* Results */}
        <div className="space-y-3">
          {results.map((result, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl p-4 border-l-4 ${
                result.status === 'success' ? 'border-brand-700' :
                result.status === 'error' ? 'border-red-500' :
                result.status === 'running' ? 'border-blue-500' :
                'border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{result.name}</h3>
                  <p className={`text-sm ${
                    result.status === 'error' ? 'text-red-600' :
                    result.status === 'success' ? 'text-brand-900' :
                    'text-slate-600'
                  }`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <pre className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap">
                      {result.details}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {allSuccess && (
          <div className="mt-6 p-4 bg-brand-50 border border-brand-200 rounded-xl">
            <div className="flex items-center gap-2 text-brand-900">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Alla tester lyckades!</span>
            </div>
            <p className="text-brand-900 text-sm mt-1">
              Storage är korrekt konfigurerat. Bilduppladdning till CV ska fungera nu.
            </p>
            {testImage && (
              <div className="mt-3">
                <p className="text-sm text-slate-600 mb-2">Testbild som laddades upp:</p>
                <img 
                  src={testImage} 
                  alt="Test" 
                  className="w-20 h-20 object-cover rounded border"
                />
              </div>
            )}
          </div>
        )}

        {hasErrors && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Vissa tester misslyckades</span>
            </div>
            <p className="text-red-600 text-sm mt-1">
              Följ anvisningarna ovan för att åtgärda felen. 
              <a 
                href="https://github.com/supabase/supabase-js/blob/main/README.md" 
                className="underline ml-1"
                target="_blank"
              >
                Se den detaljerade guiden
              </a>
            </p>
          </div>
        )}

        {/* Manual test section */}
        <div className="mt-8 p-4 bg-slate-100 rounded-xl">
          <h3 className="font-semibold text-slate-800 mb-2">Manuell test</h3>
          <p className="text-sm text-slate-600 mb-3">
            Om automatiska tester misslyckas, prova att ladda upp en bild manuellt:
          </p>
          <a 
            href="https://app.supabase.com/project/_/storage/buckets" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ImageIcon className="w-4 h-4" />
            Öppna Supabase Storage →
          </a>
        </div>
      </div>
    </div>
  )
}
