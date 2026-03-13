import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useZodForm } from '../hooks/useZodForm'
import { loginSchema, type LoginInput } from '../lib/validations'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, isAuthenticated, isLoading: authLoading, error: authError, clearError } = useAuthStore()
  
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
  } = useZodForm({
    schema: loginSchema,
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async (data) => {
      const { error: signInError } = await signIn(data.email, data.password)
      
      if (signInError) {
        // Error is shown via authError from store
      }
      // Navigation happens automatically via useEffect when isAuthenticated changes
    },
  })

  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // Sync auth error from store
  useEffect(() => {
    if (authError) {
      // Error is displayed below
    }
  }, [authError])

  const handleDemoLogin = async () => {
    clearError()
    
    // Use a fixed demo account to avoid creating new users every time
    const demoEmail = 'demo@jobin.se'
    const demoPassword = 'Demo123456!'
    
    setValue('email', demoEmail)
    setValue('password', demoPassword)

    const { error: signInError } = await signIn(demoEmail, demoPassword)
    
    if (signInError) {
      // If login fails, the demo account might not exist yet
      // Show a helpful message instead of auto-creating
      console.error('Demo login failed:', signInError)
      // The authError from store will be displayed
    }
  }

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-slate-800 flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/jobin-logo.png" 
            alt="Jobin" 
            className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg object-contain bg-white"
          />
          <h1 className="text-2xl font-bold text-white">Jobin</h1>
          <p className="text-teal-200 mt-1">Din väg till nytt jobb</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Välkommen tillbaka!</h2>
          <p className="text-slate-500 text-center mb-6">Logga in för att fortsätta</p>

          {(authError || errors.email || errors.password) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              {authError && <p className="text-red-600 text-sm">{authError}</p>}
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
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
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    touched.email && errors.email 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-300'
                  }`}
                  placeholder="namn@exempel.se"
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    touched.password && errors.password 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-300'
                  }`}
                  placeholder="Ange ditt lösenord"
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
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
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
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
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
            disabled={isSubmitting}
            className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>🚀</span>
            <span>{isSubmitting ? 'Skapar demo...' : 'Utforska med demokonto'}</span>
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-indigo-200 hover:text-white text-sm">
            ← Tillbaka till Jobin
          </Link>
        </div>
      </div>
    </div>
  )
}


