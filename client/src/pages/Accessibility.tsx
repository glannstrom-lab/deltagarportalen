/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + helper-export */
import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Accessibility as AccessibilityIcon,
  Eye,
  Keyboard,
  Volume2,
  Mail,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from '@/components/ui/icons'

function Section({ icon: Icon, title, children }: { icon: ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
        <Icon className="w-5 h-5 text-[var(--c-text)]" />
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till startsidan
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tillgänglighetsredogörelse
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Senast uppdaterad: 2026-05-15
          </p>
        </header>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-8 space-y-8">

          <Section icon={AccessibilityIcon} title="Vår ambition">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Jobin.se ska kunna användas av alla — oavsett funktionsförmåga. Vi följer EU:s tillgänglighetsdirektiv (European Accessibility Act, direktiv 2019/882) och strävar efter att uppfylla <strong>WCAG 2.1 nivå AA</strong>. Vår målgrupp inkluderar personer med fysiska och kognitiva utmaningar, vilket gör tillgänglighet centralt för vår verksamhet.
            </p>
          </Section>

          <Section icon={CheckCircle} title="Vad som fungerar">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Tangentbordsnavigering:</strong> Hela portalen kan användas utan mus. Skip-länkar finns för att hoppa direkt till huvudinnehåll.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Skärmläsarstöd:</strong> Vi använder semantisk HTML och ARIA-attribut. Knappar är `&lt;button&gt;`, inte klickbara `&lt;div&gt;`.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Reducerad rörelse:</strong> Animationer pausas automatiskt om du har "prefers-reduced-motion" aktiverat i ditt operativsystem.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Lugnt läge (Calm Mode):</strong> Tonad färgpalett och minskat informationsflöde för kognitiv tillgänglighet.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Fokusläge:</strong> En sak i taget, för dig som behöver mindre stimuli.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Energianpassning:</strong> Du kan ange din dagsenergi och portalen anpassar omfattningen.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Två språk:</strong> Svenska och engelska. Du kan byta när som helst.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Mörkt läge:</strong> Följer ditt systemval eller manuellt val.</span></li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="Kända brister">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Vi är ärliga med var vi inte är fullt ut tillgängliga ännu. Vi arbetar aktivt med dessa områden:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Färgkontrast:</strong> Inte alla element är formellt verifierade mot WCAG 2.1 AA-nivå (4.5:1 för normal text). Pågående audit.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Komplex visualisering:</strong> Diagram (RIASEC-radar, lönedata) saknar fullständigt textalternativ.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>PDF-export:</strong> Genererade CV-PDF:er har inte verifierad tagging för skärmläsare.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Röststyrning:</strong> Stöds endast i intervjusimulator, inte i hela portalen.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Lättläst (klarspråk):</strong> Mikrokopia är förenklad men finns ingen formell "lättläst"-version av allt innehåll.</span></li>
            </ul>
          </Section>

          <Section icon={Eye} title="WCAG 2.1 — vår status per princip">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Möjligt att uppfatta (Perceivable):</strong> Delvis uppfyllt. Alt-text på bilder, men diagram saknar fullständig beskrivning.</li>
              <li><strong>Hanterbart (Operable):</strong> Uppfyllt. Tangentbordsnav, ingen tidsbegränsning, skip-länkar.</li>
              <li><strong>Begripligt (Understandable):</strong> Uppfyllt. Klart språk, konsekvent navigation, formulärfel beskrivs.</li>
              <li><strong>Robust:</strong> Uppfyllt. Semantisk HTML, ARIA, kompatibelt med vanliga hjälpmedel.</li>
            </ul>
          </Section>

          <Section icon={Keyboard} title="Hur du kan navigera">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Tab</strong> — flytta fokus framåt</li>
              <li><strong>Shift + Tab</strong> — bakåt</li>
              <li><strong>Enter / Space</strong> — aktivera knapp/länk</li>
              <li><strong>Esc</strong> — stäng modaler och dialoger</li>
              <li><strong>Pilarna</strong> — navigera i listor och menyer</li>
            </ul>
          </Section>

          <Section icon={Volume2} title="Hjälpmedel vi testat med">
            <p className="text-gray-700 dark:text-gray-300">
              Vi testar löpande med NVDA (Windows), VoiceOver (macOS/iOS) och TalkBack (Android). Browserstöd: Chrome, Firefox, Safari, Edge.
            </p>
          </Section>

          <Section icon={ExternalLink} title="Tillsynsmyndighet">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Om du tycker att vi inte uppfyller tillgänglighetskraven kan du anmäla det till oss (se kontaktuppgifter nedan). Du kan också anmäla till Myndigheten för digital förvaltning (DIGG) som har tillsyn för offentlig sektor, eller till Diskrimineringsombudsmannen (DO) eftersom bristande tillgänglighet är diskriminering enligt diskrimineringslagen (2008:567).
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mt-3">
              <li><strong>DIGG:</strong> <a href="https://www.digg.se" className="text-[var(--c-text)] underline">digg.se</a></li>
              <li><strong>DO:</strong> <a href="https://www.do.se" className="text-[var(--c-text)] underline">do.se</a></li>
            </ul>
          </Section>

          <Section icon={Mail} title="Kontakta oss om tillgänglighet">
            <p className="text-gray-700 dark:text-gray-300">
              Hittar du något som inte fungerar? Hör av dig — vi prioriterar tillgänglighetsbuggar.
            </p>
            <p className="mt-3 text-gray-700 dark:text-gray-300">
              Email: <a href="mailto:tillganglighet@jobin.se" className="text-[var(--c-text)] font-medium underline">tillganglighet@jobin.se</a>
            </p>
          </Section>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-4 text-sm text-stone-500 dark:text-stone-400">
            <p>Denna redogörelse upprättades 2026-05-15 enligt EU:s tillgänglighetsdirektiv (2019/882) och svensk lag (2023:254). Vi granskar redogörelsen vid varje större uppdatering, dock minst årligen.</p>
          </div>

        </div>
      </div>
    </div>
  )
}
