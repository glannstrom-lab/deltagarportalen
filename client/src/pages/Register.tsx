import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { useZodForm } from '../hooks/useZodForm'
import { registerSchema } from '../lib/validations'
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, Check, X } from '@/components/ui/icons'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp } = useAuthStore()

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
            className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg object-contain bg-white dark:bg-stone-800"
          />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Jobin</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('auth.pathStartsHere')}</p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">{t('auth.createAccount')}</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">{t('auth.firstStep')}</p>

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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
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
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
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
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {isPassed ? (
                          <Check size={16} className="text-green-500 dark:text-green-400" />
                        ) : (
                          <X size={16} className="text-stone-300 dark:text-stone-500" />
                        )}
                        <span>{rule.label}</span>
                      </li>
                    )
                  })}
                </ul>
                {isPasswordValid && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
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
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
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
                  className="mt-1 h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600 dark:text-gray-300">
                  {t('auth.consent.acceptTerms')}{' '}
                  <Link to="/terms" target="_blank" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline">
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
                  className="mt-1 h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700"
                />
                <label htmlFor="acceptPrivacy" className="text-sm text-gray-600 dark:text-gray-300">
                  {t('auth.consent.acceptPrivacy')}{' '}
                  <Link to="/privacy" target="_blank" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline">
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
                  className="mt-1 h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700"
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
              className="w-full bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800"
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
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold"
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
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm"
          >
            ← {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
