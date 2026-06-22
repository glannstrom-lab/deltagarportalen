import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Svenska är default-språket och laddas eagerly. Engelskan (~332 KB JSON)
// lazy-laddas i en egen chunk — den drogs tidigare in i entry-chunken för
// ALLA användare trots att de flesta kör svenska (P1, 2026-06-22).
import sv from './locales/sv.json'

// Hämta sparat språk från localStorage eller använd svenska som default
const savedLanguage = localStorage.getItem('language') || 'sv'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      sv: { translation: sv },
    },
    lng: savedLanguage,
    fallbackLng: 'sv',
    interpolation: {
      escapeValue: false, // React sköter XSS-skydd
    },
    react: {
      useSuspense: false, // Undvik suspense för enklare hydration
    },
  })

// Ladda in ett språk-bundle on demand. Svenska finns alltid; övriga
// (i praktiken 'en') hämtas dynamiskt och registreras första gången de behövs.
// Centraliserat här så att INGEN anropare av changeLanguage() behöver känna
// till lazy-laddningen — när bundlen väl är inne tvingar vi en om-rendering.
async function ensureLanguageLoaded(lng: string): Promise<void> {
  if (lng === 'en' && !i18n.hasResourceBundle('en', 'translation')) {
    try {
      const { default: en } = await import('./locales/en.json')
      i18n.addResourceBundle('en', 'translation', en, true, true)
      // addResourceBundle triggar ingen om-rendering i react-i18next.
      // Om språket redan är aktivt: kör changeLanguage igen för att rendera om
      // nu när strängarna finns (no-op-loop bryts eftersom bundlen då finns).
      if (i18n.language === lng) {
        await i18n.changeLanguage(lng)
      }
    } catch (err) {
      console.warn('[i18n] Kunde inte ladda språk:', lng, err)
    }
  }
}

// Om användaren redan står på engelska vid sidladdning: hämta bundlen.
// Tills den är inne faller i18next tillbaka på svenska (fallbackLng).
if (savedLanguage !== 'sv') {
  void ensureLanguageLoaded(savedLanguage)
}

// Lyssna på språkändringar och spara till localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
  // Uppdatera HTML lang-attribut
  document.documentElement.lang = lng
  // Säkerställ att bundlen finns (no-op om redan laddad eller svenska)
  void ensureLanguageLoaded(lng)
})

// Sätt initial lang-attribut
document.documentElement.lang = savedLanguage

export default i18n
