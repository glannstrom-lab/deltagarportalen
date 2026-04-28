import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { useZodForm } from '../hooks/useZodForm'
import { loginSchema, type LoginInput } from '../lib/validations'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from '@/components/ui/icons'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

// Google Logo SVG component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signIn, signInWithGoogle, isAuthenticated, isLoading: authLoading, error: authError } = useAuthStore()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
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

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="animate-spin text-[var(--c-solid)] dark:text-[var(--c-text)]" size={48} aria-hidden="true" />
        <span className="sr-only">Laddar...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <OptimizedImage
            src="/logo-jobin.png"
            alt="Jobin"
            loading="eager"
            className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg object-contain bg-white dark:bg-stone-800"
          />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Jobin</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('auth.yourPath')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">{t('auth.welcomeBack')}</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">{t('auth.loginToContinue')}</p>

          {(authError || errors.email || errors.password) && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              {authError && <p className="text-red-600 dark:text-red-400 text-sm">{authError}</p>}
              {errors.email && <p className="text-red-600 dark:text-red-400 text-sm">{errors.email}</p>}
              {errors.password && <p className="text-red-600 dark:text-red-400 text-sm">{errors.password}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    touched.email && errors.email
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    touched.password && errors.password
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                >
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)] text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800"
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-stone-800 text-gray-500 dark:text-gray-400">
                {t('auth.orContinueWith', 'eller fortsätt med')}
              </span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={async () => {
              setIsGoogleLoading(true)
              await signInWithGoogle()
              setIsGoogleLoading(false)
            }}
            disabled={isGoogleLoading}
            className="w-full bg-white dark:bg-stone-700 hover:bg-stone-50 dark:hover:bg-stone-600 border border-stone-300 dark:border-stone-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800"
          >
            {isGoogleLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>{t('auth.continueWithGoogle', 'Fortsätt med Google')}</span>
          </button>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-[var(--c-text)] dark:text-[var(--c-text)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] font-semibold">
                {t('auth.createAccountLink')}
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-[var(--c-text)] dark:text-[var(--c-text)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] text-sm">
            ← {t('auth.backToJobin')}
          </Link>
        </div>
      </div>
    </div>
  )
}
