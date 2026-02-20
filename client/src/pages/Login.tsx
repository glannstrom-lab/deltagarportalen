import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/api'
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
      const response = await authApi.login(email, password)
      setAuth(response.token, response.user)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Inloggningen misslyckades')
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

          {/* Error Message */}
          {error && (
            <div 
              role="alert" 
              aria-live="polite"
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                E-postadress
              </label>
              <div className="relative">
                <Mail 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
                  size={20} 
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                  placeholder="namn@exempel.se"
                  required
                  aria-required="true"
                  aria-label="E-postadress"
                  aria-invalid={!email && error ? 'true' : 'false'}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Lösenord
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
                  size={20} 
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                  placeholder="Ange ditt lösenord"
                  required
                  aria-required="true"
                  aria-label="Lösenord"
                  aria-invalid={!password && error ? 'true' : 'false'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded p-1"
                  aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                  <span>Loggar in...</span>
                </>
              ) : (
                <>
                  <span>Logga in</span>
                  <ArrowRight size={20} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Har du inget konto?{' '}
              <Link 
                to="/register" 
                className="text-teal-600 hover:text-teal-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 rounded px-1"
              >
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
            onClick={async () => {
              setEmail('demo@demo.se')
              setPassword('demo')
              setError('')
              setLoading(true)
              
              try {
                // First try to register
                try {
                  await authApi.register({
                    email: 'demo@demo.se',
                    password: 'demo',
                    firstName: 'Demo',
                    lastName: 'Användare'
                  })
                } catch (regErr: any) {
                  // User might already exist, that's ok
                  console.log('Registration might have failed, trying login:', regErr.message)
                }
                
                // Then login
                const response = await authApi.login('demo@demo.se', 'demo')
                setAuth(response.token, response.user)
                navigate('/')
              } catch (err: any) {
                setError(err.message || 'Kunde inte skapa eller logga in med demokonto')
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
          >
            <span className="text-xl" aria-hidden="true">🚀</span>
            <span>{loading ? 'Skapar demokonto...' : 'Utforska med demokonto'}</span>
          </button>
          
          <p className="mt-3 text-center text-xs text-slate-400">
            Perfekt för att testa portalen utan att skapa ett konto
          </p>
        </div>

        {/* Skip Link för inloggad användare som vill komma tillbaka */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="text-teal-200 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1"
          >
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  )
}
