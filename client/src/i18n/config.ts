import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import sv from './locales/sv.json'
import en from './locales/en.json'

// Hämta sparat språk från localStorage eller använd svenska som default
const savedLanguage = localStorage.getItem('language') || 'sv'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      sv: { translation: sv },
      en: { translation: en },
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

// Lyssna på språkändringar och spara till localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
  // Uppdatera HTML lang-attribut
  document.documentElement.lang = lng
})

// Sätt initial lang-attribut
document.documentElement.lang = savedLanguage

export default i18n
