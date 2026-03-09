import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, FileText, Trash2, Mail } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                J
              </div>
              <span className="text-xl font-bold text-indigo-600">Jobin</span>
            </Link>
            <Link 
              to="/"
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Integritetspolicy</h1>
          <p className="text-slate-600">Så här hanterar vi dina personuppgifter</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12 space-y-10">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Eye className="w-5 h-5 text-indigo-600" />
              Vilken information samlar vi in?
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              För att kunna erbjuda dig en personlig och effektiv jobbsökarupplevelse samlar vi in följande information:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Kontaktuppgifter:</strong> Namn, e-postadress och telefonnummer</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Profilinformation:</strong> CV, personligt brev, kompetenser och erfarenheter</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Aktivitetsdata:</strong> Sparade jobb, ansökningar och dagboksanteckningar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Användningsdata:</strong> Hur du använder plattformen för att förbättra våra tjänster</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-indigo-600" />
              Hur skyddar vi din information?
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Vi tar säkerheten på största allvar och använder flera lager av skydd:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>All data överförs via krypterad SSL/TLS-anslutning</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Lösenord lagras krypterat med moderna hashningsalgoritmer</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Regelbundna säkerhetsgranskningar och uppdateringar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Begränsad åtkomst till personuppgifter inom organisationen</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              Hur använder vi din information?
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Din information används för att:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Skapa och hantera ditt konto</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Personalisera din jobbsökarupplevelse</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Skicka relevanta jobbrekommendationer och påminnelser</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Förbättra våra tjänster baserat på användarmönster</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-indigo-600" />
              Dina rättigheter
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Enligt GDPR har du följande rättigheter:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Rätt till tillgång:</strong> Begära en kopia av dina personuppgifter</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Rätt till rättelse:</strong> Uppdatera eller korrigera felaktig information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Rätt till radering:</strong> Begära att vi tar bort dina uppgifter</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>Rätt till dataportabilitet:</strong> Få ut din data i ett maskinläsbart format</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-indigo-600" />
              Kontakta oss
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Har du frågor om vår integritetspolicy eller hur vi hanterar dina uppgifter? 
              Kontakta oss på{' '}
              <a href="mailto:support@jobin.se" className="text-indigo-600 hover:underline">
                support@jobin.se
              </a>
            </p>
          </section>

          <div className="border-t border-slate-200 pt-8">
            <p className="text-sm text-slate-500">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            &copy; 2026 Jobin. Alla rättigheter förbehållna.
          </p>
        </div>
      </footer>
    </div>
  )
}
