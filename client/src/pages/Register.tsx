import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useZodForm } from '../hooks/useZodForm'
import { registerSchema } from '../lib/validations'
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, Check, X } from 'lucide-react'

// Valideringsregler för lösenord (för UI-visning)
const passwordRules = [
  { id: 'length', label: 'Minst 8 tecken', test: (pwd: string) => pwd.length >= 8 },
  { id: 'uppercase', label: 'En stor bokstav (A-Z)', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 'lowercase', label: 'En liten bokstav (a-z)', test: (pwd: string) => /[a-z]/.test(pwd) },
  { id: 'number', label: 'En siffra (0-9)', test: (pwd: string) => /[0-9]/.test(pwd) },
]

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuthStore()
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
    },
    onSubmit: async (data) => {
      setSubmitError('')
      
      try {
        const { error: signUpError } = await signUp({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'USER'
        })

        if (signUpError) {
          if (signUpError.includes('finns redan')) {
            throw new Error('En användare med denna e-postadress finns redan. Logga in istället.')
          }
          throw new Error(signUpError)
        }

        // Navigera till dashboard
        navigate('/')
      } catch (err: any) {
        setSubmitError(err.message || 'Det gick inte att skapa kontot. Försök igen om en stund.')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-teal-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-teal-700 font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Deltagarportalen</h1>
          <p className="text-teal-200 mt-1">Din väg till nytt jobb börjar här</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Skapa ditt konto</h2>
          <p className="text-slate-500 text-center mb-6">Ta det första steget mot din nya karriär</p>

          {/* Error Message */}
          {submitError && (
            <div 
              role="alert" 
              aria-live="polite"
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {submitError}
            </div>
          )}

          {/* Validation Summary */}
          {(Object.keys(errors).length > 0 && Object.keys(touched).length > 0) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm font-medium mb-1">Vänligen korrigera följande:</p>
              <ul className="text-amber-700 text-sm list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  touched[field as keyof typeof touched] && <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="firstName"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Förnamn
                </label>
                <div className="relative">
                  <User 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      touched.firstName && errors.firstName 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-slate-300'
                    }`}
                    placeholder="Anna"
                    autoComplete="given-name"
                  />
                </div>
                {touched.firstName && errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label 
                  htmlFor="lastName"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Efternamn
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    touched.lastName && errors.lastName 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-300'
                  }`}
                  placeholder="Andersson"
                  autoComplete="family-name"
                />
                {touched.lastName && errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

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
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    touched.password && errors.password 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-300'
                  }`}
                  placeholder="Välj ett säkert lösenord"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}

              {/* Password Strength Indicator */}
              <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-slate-700">Ditt lösenord behöver:</p>
                <ul className="space-y-1">
                  {passwordRules.map((rule) => {
                    const isPassed = rule.test(values.password)
                    return (
                      <li 
                        key={rule.id}
                        className={`flex items-center gap-2 text-sm ${
                          values.password === '' 
                            ? 'text-slate-500' 
                            : isPassed 
                              ? 'text-green-600' 
                              : 'text-slate-400'
                        }`}
                      >
                        {isPassed ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-slate-300" />
                        )}
                        <span>{rule.label}</span>
                      </li>
                    )
                  })}
                </ul>
                {isPasswordValid && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    ✨ Perfekt! Ditt lösenord är säkert.
                  </p>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Bekräfta lösenord
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    touched.confirmPassword && errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-300'
                  }`}
                  placeholder="Upprepa lösenordet"
                  autoComplete="new-password"
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
              {values.confirmPassword && values.password === values.confirmPassword && !errors.confirmPassword && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                  <Check size={16} />
                  Lösenorden matchar
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Skapar ditt konto...</span>
                </>
              ) : (
                <>
                  <span>Skapa konto</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Har du redan ett konto?{' '}
              <Link 
                to="/login" 
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Logga in här
              </Link>
            </p>
          </div>
        </div>

        {/* Tillbaka-länk */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="text-teal-200 hover:text-white text-sm"
          >
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  )
}
