import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { useZodForm } from '../hooks/useZodForm'
import { loginSchema, type LoginInput } from '../lib/validations'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from '@/components/ui/icons'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

export default function Login() {
  const { t } = useTranslation()
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
      <div
        className="min-h-screen bg-gradient-to-br from-violet-600 to-stone-800 flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="animate-spin text-white" size={48} aria-hidden="true" />
        <span className="sr-only">Laddar...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-stone-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <OptimizedImage
            src="/logo-jobin.png"
            alt="Jobin"
            loading="eager"
            className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg object-contain bg-white"
          />
          <h1 className="text-2xl font-bold text-white">Jobin</h1>
          <p className="text-violet-200 mt-1">{t('auth.yourPath')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">{t('auth.welcomeBack')}</h2>
          <p className="text-slate-500 text-center mb-6">{t('auth.loginToContinue')}</p>

          {(authError || errors.email || errors.password) && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              {authError && <p className="text-red-600 text-sm">{authError}</p>}
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                {t('auth.email')}
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
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-900 ${
                    touched.email && errors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-stone-300'
                  }`}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                {t('auth.password')}
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
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-900 ${
                    touched.password && errors.password
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-stone-300'
                  }`}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-violet-600 text-white py-3 rounded-lg font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{t('auth.loggingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.login')}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-stone-600">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-violet-600 hover:text-violet-700 font-semibold">
                {t('auth.createAccountLink')}
              </Link>
            </p>
          </div>

          {/* Demo Login Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-slate-400 text-sm">{t('auth.or')}</span>
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
            <span>{isSubmitting ? t('auth.creatingDemo') : t('auth.demoAccount')}</span>
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-violet-200 hover:text-white text-sm">
            ← {t('auth.backToJobin')}
          </Link>
        </div>
      </div>
    </div>
  )
}


