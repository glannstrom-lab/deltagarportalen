import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, Check, X } from 'lucide-react'

// Valideringsregler för lösenord
const passwordRules = [
  { id: 'length', label: 'Minst 10 tecken', test: (pwd: string) => pwd.length >= 10 },
  { id: 'uppercase', label: 'En stor bokstav (A-Z)', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 'lowercase', label: 'En liten bokstav (a-z)', test: (pwd: string) => /[a-z]/.test(pwd) },
  { id: 'number', label: 'En siffra (0-9)', test: (pwd: string) => /[0-9]/.test(pwd) },
  { id: 'special', label: 'Ett specialtecken (!@#$%^&*)', test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
]

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Validera lösenordsstyrka i realtid
  const passwordStrength = useMemo(() => {
    const passed = passwordRules.filter(rule => rule.test(formData.password))
    return {
      passed,
      score: passed.length,
      total: passwordRules.length,
      isValid: passed.length === passwordRules.length,
    }
  }, [formData.password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Lösenorden matchar inte. Kontrollera att du skrivit samma lösenord två gånger.')
      return
    }

    if (!passwordStrength.isValid) {
      setError('Lösenordet uppfyller inte alla krav. Kontrollera listan nedan.')
      return
    }

    setLoading(true)

    try {
      // 🆕 NYTT: Använd Supabase för registrering
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'USER'
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          throw new Error('En användare med denna e-postadress finns redan. Logga in istället.')
        }
        throw new Error(signUpError.message)
      }

      if (!signUpData.user) {
        throw new Error('Kunde inte skapa konto. Försök igen.')
      }

      // Vänta på att profilen skapas (trigger körs)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Hämta profilen
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single()

      if (profileError) {
        console.warn('Kunde inte hämta profil:', profileError)
      }

      // Om användaren behöver bekräfta e-post
      if (!signUpData.session) {
        setError('')
        alert('Ett bekräftelsemejl har skickats till din e-postadress. Klicka på länken i mejlet för att aktivera ditt konto.')
        navigate('/login')
        return
      }

      // Spara i auth store
      setAuth(signUpData.session.access_token, {
        id: signUpData.user.id,
        email: signUpData.user.email!,
        firstName: profile?.first_name || formData.firstName,
        lastName: profile?.last_name || formData.lastName,
        role: profile?.role || 'USER'
      })

      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Det gick inte att skapa kontot. Försök igen om en stund.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

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
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Anna"
                    required
                    autoComplete="given-name"
                  />
                </div>
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
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Andersson"
                  required
                  autoComplete="family-name"
                />
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
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="namn@exempel.se"
                  required
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Välj ett säkert lösenord"
                  required
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

              {/* Password Strength Indicator */}
              <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-slate-700">Ditt lösenord behöver:</p>
                <ul className="space-y-1">
                  {passwordRules.map((rule) => {
                    const isPassed = rule.test(formData.password)
                    return (
                      <li 
                        key={rule.id}
                        className={`flex items-center gap-2 text-sm ${
                          formData.password === '' 
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
                {passwordStrength.isValid && (
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
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Upprepa lösenordet"
                  required
                  autoComplete="new-password"
                />
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                  <Check size={16} />
                  Lösenorden matchar
                </p>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                  <X size={16} />
                  Lösenorden matchar inte ännu
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !passwordStrength.isValid}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
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
