/**
 * LinkedIn OAuth Callback Page
 * Handles the redirect from LinkedIn after authorization
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleLinkedInCallback } from '@/services/linkedinService'
import { LoadingState } from '@/components/ui/LoadingState'
import { Card, Button } from '@/components/ui'
import { CheckCircle, AlertCircle, Linkedin } from '@/components/ui/icons'

export default function LinkedInCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null

    async function processCallback() {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      // Check for OAuth errors
      if (errorParam) {
        setStatus('error')
        setError(
          errorParam === 'user_cancelled_authorize'
            ? 'Inloggning avbruten. Du kan försöka igen när du vill.'
            : `LinkedIn-fel: ${errorParam}`
        )
        return
      }

      if (!code || !state) {
        setStatus('error')
        setError('Ogiltig callback-URL. Försök logga in igen.')
        return
      }

      try {
        const profile = await handleLinkedInCallback(code, state)

        if (profile) {
          // Store profile temporarily for import
          sessionStorage.setItem('linkedin_profile', JSON.stringify(profile))
          setStatus('success')

          // Redirect to CV builder with import flag after short delay
          redirectTimeout = setTimeout(() => {
            navigate('/cv?import=linkedin')
          }, 2000)
        } else {
          setStatus('error')
          setError('Kunde inte hämta din LinkedIn-profil.')
        }
      } catch (err) {
        setStatus('error')
        setError(
          err instanceof Error
            ? err.message
            : 'Ett fel uppstod vid anslutningen till LinkedIn.'
        )
      }
    }

    processCallback()

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout)
      }
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-[#0077B5] rounded-xl flex items-center justify-center mx-auto mb-6">
              <Linkedin className="w-10 h-10 text-white" />
            </div>
            <LoadingState
              title="Ansluter till LinkedIn..."
              size="lg"
            />
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
              Hämtar din profildata
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Anslutning lyckades!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Din LinkedIn-profil har hämtats. Du skickas nu till CV-byggaren där du kan importera datan.
            </p>
            <div className="animate-pulse text-brand-900 dark:text-brand-400 text-sm">
              Omdirigerar...
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Något gick fel
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/cv')}
              >
                Gå till CV-byggaren
              </Button>
              <Button
                onClick={() => navigate('/linkedin-optimizer')}
                className="bg-[#0077B5] hover:bg-[#005885]"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                Försök igen
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
