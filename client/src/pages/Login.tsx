import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting login with:', { email, hasPassword: !!password })
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('Login response:', { 
        hasUser: !!data.user, 
        hasSession: !!data.session,
        error: signInError?.message 
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        
        // Tydligare felmeddelanden
        let errorMessage = signInError.message
        if (signInError.message === 'Invalid login credentials') {
          errorMessage = 'Fel e-post eller lösenord'
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'E-postadressen är inte bekräftad. Kolla din inkorg eller kontakta support.'
        } else if (signInError.message.includes('User not found')) {
          errorMessage = 'Användaren finns inte. Har du registrerat dig?'
        }
        
        throw new Error(errorMessage)
      }

      if (!data.user || !data.session) {
        throw new Error('Inloggning misslyckades')
      }

      // Hämta profilen från vår databas
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // Spara i auth store
      setAuth(data.session.access_token, {
        id: data.user.id,
        email: data.user.email!,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        role: profile?.role || 'USER'
      })

      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Inloggningen misslyckades')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    const demoEmail = `demo${Date.now()}@example.com`
    const demoPassword = 'Demo123456!'
    
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
    setLoading(true)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            first_name: 'Demo',
            last_name: 'Användare',
            role: 'USER'
          }
        }
      })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      if (signUpData.session && signUpData.user) {
        // Logga in direkt utan att skapa demo-innehåll (görs via SQL istället)
        setAuth(signUpData.session.access_token, {
          id: signUpData.user.id,
          email: signUpData.user.email!,
          firstName: 'Demo',
          lastName: 'Användare',
          role: 'USER'
        })
        navigate('/')
      } else {
        setError('Konto skapat men kunde inte loggas in automatiskt. Försök logga in manuellt.')
      }
    } catch (err: any) {
      setError(err.message || 'Kunde inte skapa demokonto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-teal-700 font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Deltagarportalen</h1>
          <p className="text-teal-200 mt-1">Din väg till nytt jobb</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Välkommen tillbaka!</h2>
          <p className="text-slate-500 text-center mb-6">Logga in för att fortsätta</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                E-postadress
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="namn@exempel.se"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Lösenord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ange ditt lösenord"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Loggar in...</span>
                </>
              ) : (
                <>
                  <span>Logga in</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Har du inget konto?{' '}
              <Link to="/register" className="text-teal-600 hover:text-teal-700 font-semibold">
                Skapa ett konto
              </Link>
            </p>
          </div>

          {/* Demo Login Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-slate-400 text-sm">eller</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Demo Account Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>🚀</span>
            <span>{loading ? 'Skapar demo med innehåll...' : 'Utforska med demokonto'}</span>
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-teal-200 hover:text-white text-sm">
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  )
}
