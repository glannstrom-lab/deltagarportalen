import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { useZodForm } from '../hooks/useZodForm'
import { registerSchema } from '../lib/validations'
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, Check, X } from '@/components/ui/icons'
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

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuthStore()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Password validation rules with translated labels
  // Must match strongPasswordSchema in lib/validations/index.ts
  const passwordRules = useMemo(() => [
    { id: 'length', label: t('auth.passwordRules.minLength'), test: (pwd: string) => pwd.length >= 12 },
    { id: 'uppercase', label: t('auth.passwordRules.uppercase'), test: (pwd: string) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: t('auth.passwordRules.lowercase'), test: (pwd: string) => /[a-z]/.test(pwd) },
    { id: 'number', label: t('auth.passwordRules.number'), test: (pwd: string) => /[0-9]/.test(pwd) },
    { id: 'special', label: t('auth.passwordRules.special'), test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
  ], [t])
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')

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
    schema: registerSchema,
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptPrivacy: false,
      acceptAiProcessing: false,
    },
    onSubmit: async (data) => {
      setSubmitError('')

      try {
        const { error: signUpError } = await signUp({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'USER',
          consent: {
            terms: data.acceptTerms,
            privacy: data.acceptPrivacy,
            aiProcessing: data.acceptAiProcessing,
          }
        })

        if (signUpError) {
          if (signUpError.includes('finns redan') || signUpError.includes('already exists')) {
            throw new Error(t('auth.errors.userExists'))
          }
          throw new Error(signUpError)
        }

        // Navigera till dashboard
        navigate('/')
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : t('auth.errors.createFailed'))
      }
    },
  })

  // Validera lösenordsstyrka i realtid (för UI-indikator)
  const passwordStrength = useMemo(() => {
    const passed = passwordRules.filter(rule => rule.test(values.password))
    return {
      passed,
      score: passed.length,
      total: passwordRules.length,
      isValid: passed.length === passwordRules.length,
    }
  }, [values.password])

  // Kombinera Zod-validering med UI-regler
  const isPasswordValid = passwordStrength.isValid && !errors.password

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <OptimizedImage
            src="/logo-jobin.png"
            alt="Jobin"
            loading="eager"
            className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain bg-white dark:bg-stone-800"
          />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Jobin</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('auth.pathStartsHere')}</p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">{t('auth.createAccount')}</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">{t('auth.firstStep')}</p>

          {/* Google Quick Registration */}
          <button
            type="button"
            onClick={async () => {
              setIsGoogleLoading(true)
              await signInWithGoogle()
              setIsGoogleLoading(false)
            }}
            disabled={isGoogleLoading}
            className="w-full bg-white dark:bg-stone-700 hover:bg-stone-50 dark:hover:bg-stone-600 border border-stone-300 dark:border-stone-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800"
          >
            {isGoogleLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>{t('auth.registerWithGoogle', 'Snabbregistrera med Google')}</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-stone-800 text-gray-500 dark:text-gray-400">
                {t('auth.orWithEmail', 'eller med e-post')}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
            >
              {submitError}
            </div>
          )}

          {/* Validation Summary */}
          {(Object.keys(errors).length > 0 && Object.keys(touched).length > 0) && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-1">{t('auth.pleaseCorrect')}:</p>
              <ul className="text-amber-700 dark:text-amber-400 text-sm list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  touched[field as keyof typeof touched] && <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-1"
                >
                  {t('auth.firstName')}
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300"
                    size={20}
                    aria-hidden="true"
                  />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-brand-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                      touched.firstName && errors.firstName
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                    placeholder="Anna"
                    autoComplete="given-name"
                  />
                </div>
                {touched.firstName && errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-1"
                >
                  {t('auth.lastName')}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-brand-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    touched.lastName && errors.lastName
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder="Andersson"
                  autoComplete="family-name"
                />
                {touched.lastName && errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-1"
              >
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300"
                  size={20}
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-brand-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    touched.email && errors.email
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder="namn@exempel.se"
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-1"
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300"
                  size={20}
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-brand-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    touched.password && errors.password
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}

              {/* Password Strength Indicator */}
              <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('auth.passwordNeeds')}:</p>
                <ul className="space-y-1">
                  {passwordRules.map((rule) => {
                    const isPassed = rule.test(values.password)
                    return (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-2 text-sm ${
                          values.password === ''
                            ? 'text-gray-600 dark:text-gray-300'
                            : isPassed
                              ? 'text-brand-900 dark:text-brand-400'
                              : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {isPassed ? (
                          <Check size={16} className="text-brand-700 dark:text-brand-400" />
                        ) : (
                          <X size={16} className="text-stone-300 dark:text-stone-500" />
                        )}
                        <span>{rule.label}</span>
                      </li>
                    )
                  })}
                </ul>
                {isPasswordValid && (
                  <p className="text-sm text-brand-900 dark:text-brand-400 font-medium mt-2">
                    {t('auth.passwordSecure')}
                  </p>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-1"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300"
                  size={20}
                  aria-hidden="true"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-brand-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    touched.confirmPassword && errors.confirmPassword
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
              {values.confirmPassword && values.password === values.confirmPassword && !errors.confirmPassword && (
                <p className="mt-2 text-sm text-brand-900 dark:text-brand-400 flex items-center gap-1">
                  <Check size={16} />
                  {t('auth.passwordsMatch')}
                </p>
              )}
            </div>

            {/* Consent Section */}
            <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-700/50 rounded-lg border border-stone-200 dark:border-stone-600">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">{t('auth.consent.title')}</p>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={values.acceptTerms}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-700 dark:focus:ring-brand-400 bg-white dark:bg-stone-700"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600 dark:text-gray-300">
                  {t('auth.consent.acceptTerms')}{' '}
                  <Link to="/terms" target="_blank" className="text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 hover:underline">
                    {t('auth.consent.termsLink')}
                  </Link>
                  {' '}<span className="text-red-500 dark:text-red-400">*</span>
                </label>
              </div>
              {touched.acceptTerms && errors.acceptTerms && (
                <p className="ml-7 text-sm text-red-600 dark:text-red-400">{errors.acceptTerms}</p>
              )}

              {/* Privacy Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptPrivacy"
                  name="acceptPrivacy"
                  checked={values.acceptPrivacy}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-700 dark:focus:ring-brand-400 bg-white dark:bg-stone-700"
                />
                <label htmlFor="acceptPrivacy" className="text-sm text-gray-600 dark:text-gray-300">
                  {t('auth.consent.acceptPrivacy')}{' '}
                  <Link to="/privacy" target="_blank" className="text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 hover:underline">
                    {t('auth.consent.privacyLink')}
                  </Link>
                  {' '}<span className="text-red-500 dark:text-red-400">*</span>
                </label>
              </div>
              {touched.acceptPrivacy && errors.acceptPrivacy && (
                <p className="ml-7 text-sm text-red-600 dark:text-red-400">{errors.acceptPrivacy}</p>
              )}

              {/* AI Processing Checkbox (optional) */}
              <div className="flex items-start gap-3 pt-2 border-t border-stone-200 dark:border-stone-600 mt-3">
                <input
                  type="checkbox"
                  id="acceptAiProcessing"
                  name="acceptAiProcessing"
                  checked={values.acceptAiProcessing}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-700 dark:focus:ring-brand-400 bg-white dark:bg-stone-700"
                />
                <div>
                  <label htmlFor="acceptAiProcessing" className="text-sm text-gray-600 dark:text-gray-300">
                    {t('auth.consent.acceptAi')}
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {t('auth.consent.aiDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid || !values.acceptTerms || !values.acceptPrivacy}
              className="w-full bg-brand-700 hover:bg-brand-900 dark:bg-brand-900 dark:hover:bg-brand-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{t('auth.creatingAccount')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.register')}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 font-semibold"
              >
                {t('auth.loginHere')}
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 text-sm"
          >
            ← {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
