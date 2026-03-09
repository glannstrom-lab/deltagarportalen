import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Scale, Users, AlertCircle, CheckCircle } from 'lucide-react'

export default function Terms() {
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
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Användarvillkor</h1>
          <p className="text-slate-600">Regler och riktlinjer för att använda Jobin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12 space-y-10">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              Acceptans av villkor
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Genom att skapa ett konto och använda Jobin godkänner du dessa användarvillkor. 
              Om du inte accepterar villkoren, vänligen använd inte våra tjänster. 
              Vi förbehåller oss rätten att uppdatera dessa villkor, och fortsatt användning 
              efter ändringar innebär att du accepterar de nya villkoren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-600" />
              Användarkonto
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              För att använda Jobin behöver du skapa ett konto. Du ansvarar för att:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Informationen du anger är sann, korrekt och aktuell</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Du skyddar ditt lösenord och inte delar det med andra</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Du omedelbart meddelar oss om obehörig åtkomst till ditt konto</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Du endast skapar ett konto per person</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Scale className="w-5 h-5 text-indigo-600" />
              Acceptabel användning
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              När du använder Jobin förbinder du dig att inte:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <span>Använda plattformen för olagliga ändamål</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <span>Publicera falsk eller vilseledande information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <span>Trakassera, hota eller diskriminera andra användare</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <span>Försöka kringgå säkerhetsåtgärder eller hacka systemet</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <span>Använda automatiserade system (botar) utan tillstånd</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              Innehåll och upphovsrätt
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              När du laddar upp innehåll till Jobin (t.ex. CV, personligt brev):
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Du behåller äganderätten till ditt innehåll</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Du ger oss rätt att lagra och visa innehållet för att tillhandahålla tjänsten</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>Du får endast ladda upp innehåll som du har rätt att använda</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600" />
              Ansvarsbegränsning
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Jobin tillhandahålls "i befintligt skick" utan garantier. Vi strävar efter 
              att hålla tjänsten tillgänglig och säker, men kan inte garantera oavbruten 
              drift. Vi ansvarar inte för eventuella förluster som uppstår vid användning 
              av plattformen. Rekommendationer och råd som ges genom plattformen är 
              vägledande och ska inte ses som professionell rådgivning.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Avslut av konto</h2>
            <p className="text-slate-600 leading-relaxed">
              Du kan när som helst välja att avsluta ditt konto. Vid avslut raderas 
              dina personuppgifter enligt vår integritetspolicy. Vi förbehåller oss 
              rätten att stänga av konton som bryter mot dessa villkor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Kontakt</h2>
            <p className="text-slate-600 leading-relaxed">
              Har du frågor om våra användarvillkor? Kontakta oss på{' '}
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
