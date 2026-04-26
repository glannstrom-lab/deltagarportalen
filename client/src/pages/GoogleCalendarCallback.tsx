/**
 * Google Calendar OAuth Callback Page
 * Handles the redirect from Google after authorization
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleGoogleCallback } from '@/services/googleCalendarService'
import { LoadingState } from '@/components/ui/LoadingState'
import { Card, Button } from '@/components/ui'
import { CheckCircle, AlertCircle, CalendarDays } from '@/components/ui/icons'

export default function GoogleCalendarCallback() {
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
          errorParam === 'access_denied'
            ? 'Åtkomst nekad. Du kan försöka igen när du vill.'
            : `Google-fel: ${errorParam}`
        )
        return
      }

      if (!code || !state) {
        setStatus('error')
        setError('Ogiltig callback-URL. Försök ansluta igen.')
        return
      }

      try {
        await handleGoogleCallback(code, state)
        setStatus('success')

        // Redirect to calendar after short delay
        redirectTimeout = setTimeout(() => {
          navigate('/calendar')
        }, 2000)
      } catch (err) {
        setStatus('error')
        setError(
          err instanceof Error
            ? err.message
            : 'Ett fel uppstod vid anslutningen till Google Calendar.'
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-brand-700 rounded-xl flex items-center justify-center mx-auto mb-6">
              <CalendarDays className="w-10 h-10 text-white" />
            </div>
            <LoadingState
              title="Ansluter till Google Calendar..."
              size="lg"
            />
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
              Konfigurerar kalendersynkronisering
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Google Calendar anslutet!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Din kalender är nu synkroniserad. Dina Google-händelser kommer visas i din kalender.
            </p>
            <div className="animate-pulse text-brand-900 dark:text-brand-400 text-sm">
              Omdirigerar till kalendern...
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
                onClick={() => navigate('/calendar')}
              >
                Gå till kalendern
              </Button>
              <Button
                onClick={() => navigate('/settings')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Försök igen
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
