/**
 * Visa Guide Tab - Work permit information for Sweden
 */
import { useState } from 'react'
import { FileCheck, AlertCircle, CheckCircle, ExternalLink, Clock, DollarSign, Building2, ChevronDown, ChevronUp } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface VisaType {
  id: string
  name: string
  description: string
  requirements: string[]
  processingTime: string
  validity: string
  canLeadToPR: boolean
  minSalary?: string
}

const VISA_TYPES: VisaType[] = [
  {
    id: 'work-permit',
    name: 'Arbetstillstånd',
    description: 'Standard arbetsvisum för anställning i Sverige. Kräver jobboffert från svensk arbetsgivare.',
    requirements: [
      'Jobboffert från svensk arbetsgivare',
      'Lön minst i nivå med kollektivavtal (eller minst 13 000 kr/mån)',
      'Arbetsgivaren måste ha annonserat tjänsten i EU/EES i 10 dagar',
      'Försäkringsskydd (sjuk, liv, arbetsmarknad, pension)',
      'Giltig pass',
    ],
    processingTime: '1-4 månader',
    validity: 'Max 2 år, kan förlängas',
    canLeadToPR: true,
    minSalary: '13 000 kr/mån',
  },
  {
    id: 'eu-blue-card',
    name: 'EU Blue Card',
    description: 'För högkvalificerade arbetstagare med universitetsutbildning eller lång yrkeserfarenhet.',
    requirements: [
      'Högskoleutbildning (minst 3 år) eller 5 års relevant yrkeserfarenhet',
      'Jobboffert med minst 1,5 x svensk genomsnittslön (~53 000 kr/mån)',
      'Anställning minst 1 år',
      'Giltigt pass',
      'Ingen säkerhetsrisk',
    ],
    processingTime: '90 dagar (snabbare)',
    validity: 'Max 4 år',
    canLeadToPR: true,
    minSalary: '~53 000 kr/mån',
  },
  {
    id: 'ict-permit',
    name: 'ICT-tillstånd',
    description: 'Företagsintern förflyttning för chefer, specialister eller trainees.',
    requirements: [
      'Anställd i koncernbolag utomlands minst 3-12 månader',
      'Förflyttning till svenskt bolag i samma koncern',
      'Chef, specialist eller trainee',
      'Lön enligt kollektivavtal',
    ],
    processingTime: '90 dagar',
    validity: 'Max 3 år (chefer/specialister), 1 år (trainees)',
    canLeadToPR: false,
  },
  {
    id: 'startup',
    name: 'Uppehållstillstånd för start av företag',
    description: 'För den som vill starta eget företag i Sverige.',
    requirements: [
      'Affärsplan',
      'Tillräckliga medel för uppehälle (minst 200 000 kr)',
      'Erfarenhet inom branschen',
      'Realistisk affärsidé',
    ],
    processingTime: '2-4 månader',
    validity: '1 år, kan förlängas till 2 år',
    canLeadToPR: true,
  },
]

export default function VisaGuideTab() {
  const [expandedVisa, setExpandedVisa] = useState<string | null>('work-permit')

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-sky-100 dark:border-sky-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Visum & Arbetstillstånd</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Guide till olika typer av arbetstillstånd i Sverige.
              Klicka på varje typ för att se krav och processinformation.
            </p>
          </div>
        </div>
      </Card>

      {/* Important notice */}
      <Card className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">Viktigt att veta</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Du måste ansöka om arbetstillstånd INNAN du reser till Sverige.
              Ansökan görs hos Migrationsverket. Arbetsgivaren måste godkänna anställningsvillkoren.
            </p>
          </div>
        </div>
      </Card>

      {/* Visa types */}
      <div className="space-y-4">
        {VISA_TYPES.map((visa) => (
          <Card
            key={visa.id}
            className={cn(
              "transition-all cursor-pointer bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700",
              expandedVisa === visa.id && "ring-2 ring-sky-200 dark:ring-sky-700"
            )}
          >
            <button
              onClick={() => setExpandedVisa(expandedVisa === visa.id ? null : visa.id)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    expandedVisa === visa.id ? "bg-gradient-to-br from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-600" : "bg-sky-100 dark:bg-sky-900/50"
                  )}>
                    <FileCheck className={cn(
                      "w-5 h-5",
                      expandedVisa === visa.id ? "text-white" : "text-sky-600 dark:text-sky-400"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{visa.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{visa.description}</p>
                  </div>
                </div>
                {expandedVisa === visa.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </button>

            {expandedVisa === visa.id && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-stone-700 space-y-4">
                {/* Quick facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-stone-700 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <Clock className="w-3 h-3" />
                      Handläggningstid
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{visa.processingTime}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-stone-700 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <FileCheck className="w-3 h-3" />
                      Giltighet
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{visa.validity}</p>
                  </div>
                  {visa.minSalary && (
                    <div className="p-3 bg-slate-50 dark:bg-stone-700 rounded-lg">
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <DollarSign className="w-3 h-3" />
                        Minimilön
                      </div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{visa.minSalary}</p>
                    </div>
                  )}
                  <div className="p-3 bg-slate-50 dark:bg-stone-700 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <Building2 className="w-3 h-3" />
                      Permanent uppehåll
                    </div>
                    <p className={cn(
                      "font-medium",
                      visa.canLeadToPR ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-300"
                    )}>
                      {visa.canLeadToPR ? 'Ja, efter 4 år' : 'Nej'}
                    </p>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Krav</h4>
                  <ul className="space-y-2">
                    {visa.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.migrationsverket.se/Privatpersoner/Arbeta-i-Sverige.html', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Migrationsverket
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Timeline to permanent residency */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Vägen till permanent uppehållstillstånd</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-stone-600" />
          <div className="space-y-6 relative">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-sky-600 dark:bg-sky-700 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">1</div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">År 0: Arbetstillstånd</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Få ditt första arbetstillstånd (max 2 år)</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-sky-500 dark:bg-sky-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">2</div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">År 2: Förläng tillståndet</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Ansök om förlängning innan det går ut</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">3</div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">År 4: Ansök om PUT</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Permanent uppehållstillstånd möjligt efter 4 års arbete</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">+</div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">År 5+: Medborgarskap</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Kan ansöka om svenskt medborgarskap</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
