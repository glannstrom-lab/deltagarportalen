 
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
  Search,
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
            Sidan senast redigerad: 2026-08-17
          </p>
          <p className="text-stone-600 dark:text-stone-400">
            Bedömningen bygger på en granskning genomförd: 2026-08-17
          </p>
        </header>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-8 space-y-8">

          <Section icon={AccessibilityIcon} title="Vår ambition">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Jobin.se ska kunna användas av alla — oavsett funktionsförmåga. Vi följer EU:s tillgänglighetsdirektiv (European Accessibility Act, direktiv 2019/882) och strävar efter att uppfylla <strong>WCAG 2.1 nivå AA</strong>. Vår målgrupp inkluderar personer med fysiska och kognitiva utmaningar, vilket gör tillgänglighet centralt för vår verksamhet.
            </p>
          </Section>

          <Section icon={Search} title="Hur bedömningen är gjord">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              Detta är en <strong>intern granskning</strong>, inte en oberoende expertgranskning. Metoden är automatiserad testning med axe-core (via Playwright, i riktig Chromium) kompletterad med manuell tangentbordstestning — 48 sidvyer, 22 sidor tangentbordstestade, 19 sidor kontrastmätta. Ingen granskning med riktig skärmläsare (NVDA, VoiceOver, TalkBack) har ännu genomförts; automatiserade verktyg kan avgöra <em>om</em> något annonseras för hjälpmedel, inte om det är begripligt.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Automatiserade verktyg som axe fångar ungefär en tredjedel av WCAG-kraven — resten kräver manuell bedömning, som vi gör löpande men inte har täckt fullt ut ännu (bland annat konsulentvyn och diagrammens textalternativ).
            </p>
          </Section>

          <Section icon={CheckCircle} title="Vad som fungerar">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Publika sidor:</strong> Startsidan, verktygssidorna och samtliga 133 guidesidor hade noll axe-överträdelser vid senaste mätningen.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Fokusindikator:</strong> Synlig på alla testade tabbstopp, med god kontrast mot bakgrunden.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Reducerad rörelse:</strong> Animationer stängs av automatiskt om du har "prefers-reduced-motion" aktiverat i ditt operativsystem.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Inga tidsgränser:</strong> Ingen nedräkning i intervjusimulatorn, CV-byggaren sparar automatiskt.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Lugnt läge (Calm Mode):</strong> Tonad färgpalett och minskat informationsflöde för kognitiv tillgänglighet.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Fokusläge:</strong> En sak i taget, för dig som behöver mindre stimuli.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Energianpassning:</strong> Du kan ange din dagsenergi och portalen anpassar omfattningen.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Två språk:</strong> Svenska och engelska. Du kan byta när som helst.</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>Mörkt läge:</strong> Följer ditt systemval eller manuellt val.</span></li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="Kända brister">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Vi är ärliga med var vi inte är fullt ut tillgängliga ännu. Det här är de brister som är mätta och bekräftade — vi arbetar med att åtgärda dem, med de allvarligaste först:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Vissa knappar saknar namn för skärmläsare:</strong> Ett fåtal ikonknappar läses upp bara som "knapp" utan att säga vad de gör, till exempel att radera ett dagboksinlägg.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Jobbkort med flera funktioner i ett:</strong> Jobbkorten i jobbsökningen och några kort i karriärverktygen har flera klickbara delar (spara, ansök, skriv brev) inuti ett större klickbart kort, vilket kan tolkas olika av olika skärmläsare.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Färgkontrast:</strong> Ett antal mindre textelement (bland annat siffror i chips och räknare på flera sidor) har inte tillräcklig kontrast mot sin bakgrund enligt WCAG 2.1 AA (4.5:1).</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Rubrikstruktur:</strong> På flera sidor hoppar rubriknivåerna (till exempel från H1 direkt till H3), vilket gör det svårare att navigera med rubriktangenten i en skärmläsare.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Komplex visualisering:</strong> Diagram (RIASEC-radar, lönedata) saknar fullständigt textalternativ.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>PDF-export:</strong> Genererade CV-PDF:er har inte verifierad tagging för skärmläsare.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Röststyrning:</strong> Stöds endast i intervjusimulator, inte i hela portalen.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Lättläst (klarspråk):</strong> En lättläst guide finns publikt, men det finns ingen lättläst-version av verktygen inne i portalen.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Riktig skärmläsartestning:</strong> Vi har ännu inte genomfört och verifierat en fullständig testomgång med NVDA, VoiceOver eller TalkBack — bara automatiserade och tangentbordsbaserade tester.</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>Konsulentvyn</strong> och några ytor (bland annat spontanansökan, nätverk, en pågående intervjusession) har inte hunnit granskas i den senaste omgången.</span></li>
            </ul>
          </Section>

          <Section icon={Eye} title="WCAG 2.1 — vår status per princip">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Möjligt att uppfatta (Perceivable):</strong> Delvis uppfyllt. Alt-text på bilder, men diagram saknar fullständig beskrivning och vissa texter har för låg kontrast (se Kända brister).</li>
              <li><strong>Hanterbart (Operable):</strong> Delvis uppfyllt. Tangentbordsnavigering fungerar överlag, men skip-länkens synlighet och mobilmenyns fokusordning är kända brister.</li>
              <li><strong>Begripligt (Understandable):</strong> Delvis uppfyllt. Klart språk och konsekvent navigation, men registreringsformulärets fel når inte fram till hjälpmedel och vissa rubrikstrukturer hoppar.</li>
              <li><strong>Robust:</strong> Delvis uppfyllt. Semantisk HTML och ARIA används på de flesta ställen, men några knappar saknar tillgängligt namn och några kort har nästlade interaktiva element.</li>
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
              Vi har ännu <strong>inte</strong> genomfört och verifierat en testomgång med en riktig skärmläsare som NVDA, VoiceOver eller TalkBack — det är en känd brist (se ovan) och vår viktigaste kvarstående lucka. Det vi har testat är tangentbordsnavigering direkt i webbläsaren och skärmläsarträdet via utvecklarverktyg, i Chrome. Vi siktar på att genomföra riktiga skärmläsartester och uppdatera den här sidan när det är gjort. Browserstöd: Chrome, Firefox, Safari, Edge.
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
            <p>Denna redogörelse upprättades ursprungligen 2026-05-15 enligt EU:s tillgänglighetsdirektiv (2019/882) och svensk lag (2023:254), skrevs om 2026-08-12 efter den interna granskningen 2026-08-09, och uppdaterades 2026-08-17 när tre av de listade bristerna hade åtgärdats: skip-länken blir numera synlig när den får fokus, mobilmenyns element ligger inte längre kvar i tabbordningen när menyn är stängd, och registreringsformulärets felmeddelanden är kopplade till sina fält. Se "Hur bedömningen är gjord" ovan. Vi uppdaterar redogörelsen vid varje större granskning, minst årligen.</p>
          </div>

        </div>
      </div>
    </div>
  )
}
