/**
 * Integration Tab - Checklist for establishing yourself in Sweden
 */
import { useState, useEffect } from 'react'
import { Users, CheckCircle, Circle, Clock, AlertCircle, ExternalLink, ChevronRight } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: string
  title: string
  description: string
  timeframe: string
  links?: { label: string; url: string }[]
  priority: 'critical' | 'important' | 'recommended'
}

const CHECKLIST_CATEGORIES = [
  {
    id: 'before-arrival',
    title: 'Före ankomst',
    items: [
      {
        id: 'visa',
        title: 'Arbetstillstånd',
        description: 'Ansök om och få godkänt arbetstillstånd innan du reser till Sverige.',
        timeframe: '1-4 månader före',
        priority: 'critical',
        links: [{ label: 'Migrationsverket', url: 'https://www.migrationsverket.se' }],
      },
      {
        id: 'housing-search',
        title: 'Börja leta bostad',
        description: 'Bostadsmarknaden i Sverige är svår. Börja leta i god tid.',
        timeframe: '2-3 månader före',
        priority: 'important',
        links: [{ label: 'Blocket Bostad', url: 'https://www.blocket.se/bostad' }],
      },
      {
        id: 'job-contract',
        title: 'Signera anställningsavtal',
        description: 'Säkerställ att alla villkor är tydliga och skriftliga.',
        timeframe: 'Innan ansökan',
        priority: 'critical',
      },
    ] as ChecklistItem[],
  },
  {
    id: 'first-week',
    title: 'Första veckan',
    items: [
      {
        id: 'personnummer',
        title: 'Ansök om personnummer',
        description: 'Registrera dig hos Skatteverket för att få svenskt personnummer. Krävs för det mesta.',
        timeframe: 'Dag 1-2',
        priority: 'critical',
        links: [{ label: 'Skatteverket', url: 'https://www.skatteverket.se/privat/folkbokforing/flyttatillsverige.4.76a43be412206334b89800052051.html' }],
      },
      {
        id: 'id-card',
        title: 'ID-kort',
        description: 'Boka tid för ID-kort hos Skatteverket (när personnummer är klart).',
        timeframe: 'Efter personnummer',
        priority: 'important',
      },
      {
        id: 'bank-account',
        title: 'Öppna bankkonto',
        description: 'Behövs för lön. Vissa banker kräver personnummer, andra accepterar samordningsnummer.',
        timeframe: 'Vecka 1',
        priority: 'critical',
        links: [
          { label: 'Nordea', url: 'https://www.nordea.se' },
          { label: 'Handelsbanken', url: 'https://www.handelsbanken.se' },
        ],
      },
      {
        id: 'phone',
        title: 'Svenskt mobilnummer',
        description: 'Skaffa svenskt SIM-kort. Behövs för BankID och många tjänster.',
        timeframe: 'Dag 1',
        priority: 'important',
      },
    ] as ChecklistItem[],
  },
  {
    id: 'first-month',
    title: 'Första månaden',
    items: [
      {
        id: 'bankid',
        title: 'BankID',
        description: 'Digital identifiering för nästan allt i Sverige. Kräver personnummer och bankkonto.',
        timeframe: '2-4 veckor',
        priority: 'critical',
      },
      {
        id: 'forsakringskassan',
        title: 'Registrera hos Försäkringskassan',
        description: 'För socialförsäkring, föräldrapenning, etc.',
        timeframe: 'Vecka 2-4',
        priority: 'important',
        links: [{ label: 'Försäkringskassan', url: 'https://www.forsakringskassan.se' }],
      },
      {
        id: 'healthcare',
        title: 'Registrera hos vårdcentral',
        description: 'Välj en vårdcentral i ditt område för primärvård.',
        timeframe: 'Vecka 2-4',
        priority: 'important',
        links: [{ label: '1177 Vårdguiden', url: 'https://www.1177.se' }],
      },
      {
        id: 'sfi',
        title: 'Anmäl dig till SFI',
        description: 'Svenska för invandrare - gratis svenskundervisning.',
        timeframe: 'Vecka 1-4',
        priority: 'recommended',
      },
    ] as ChecklistItem[],
  },
  {
    id: 'settling-in',
    title: 'Etablering (1-3 månader)',
    items: [
      {
        id: 'drivers-license',
        title: 'Körkortsfrågor',
        description: 'Kontrollera om ditt körkort gäller i Sverige eller behöver bytas.',
        timeframe: '1-3 månader',
        priority: 'recommended',
        links: [{ label: 'Transportstyrelsen', url: 'https://www.transportstyrelsen.se' }],
      },
      {
        id: 'pension',
        title: 'Pensionsfrågor',
        description: 'Förstå det svenska pensionssystemet och dina rättigheter.',
        timeframe: '1-3 månader',
        priority: 'recommended',
        links: [{ label: 'Pensionsmyndigheten', url: 'https://www.pensionsmyndigheten.se' }],
      },
      {
        id: 'tax-return',
        title: 'Förstå skattedeklaration',
        description: 'Lär dig om svensk skatt och SINK-skatt för nyanlända.',
        timeframe: 'Inom 3 månader',
        priority: 'important',
      },
    ] as ChecklistItem[],
  },
]

export default function IntegrationTab() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('integration-checklist')
    if (saved) {
      setCompleted(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('integration-checklist', JSON.stringify(completed))
  }, [completed])

  const toggleItem = (id: string) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const totalItems = CHECKLIST_CATEGORIES.flatMap(c => c.items).length
  const completedItems = Object.values(completed).filter(Boolean).length
  const progress = Math.round((completedItems / totalItems) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-sky-100 dark:border-sky-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Integrationschecklista</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Steg-för-steg guide för att etablera dig i Sverige.
              Markera punkter som klara för att spara din progress.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-4 border-t border-sky-100 dark:border-sky-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-sky-800 dark:text-sky-200">Din framsteg</span>
            <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{completedItems}/{totalItems} ({progress}%)</span>
          </div>
          <div className="h-3 bg-sky-100 dark:bg-sky-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 dark:bg-sky-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Checklist categories */}
      {CHECKLIST_CATEGORIES.map((category) => (
        <Card key={category.id} className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            {category.title}
          </h3>

          <div className="space-y-3">
            {category.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm",
                  completed[item.id]
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700"
                    : item.priority === 'critical'
                    ? "bg-rose-50/50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800"
                    : "bg-slate-50 dark:bg-stone-700 border-slate-100 dark:border-stone-600"
                )}
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {completed[item.id] ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-stone-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "font-medium",
                        completed[item.id] ? "text-emerald-800 dark:text-emerald-200 line-through" : "text-gray-800 dark:text-gray-100"
                      )}>
                        {item.title}
                      </h4>
                      {item.priority === 'critical' && !completed[item.id] && (
                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-full font-medium">
                          Kritiskt
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm mt-1",
                      completed[item.id] ? "text-emerald-600 dark:text-emerald-300" : "text-gray-600 dark:text-gray-300"
                    )}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {item.timeframe}
                      </span>
                      {item.links && (
                        <div className="flex gap-2">
                          {item.links.map((link) => (
                            <a
                              key={link.url}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-1"
                            >
                              {link.label}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Tips */}
      <Card className="bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sky-900 dark:text-sky-100">Bra att veta</p>
            <ul className="text-sm text-sky-700 dark:text-sky-300 mt-2 space-y-1">
              <li>- Personnummer kan ta 2-8 veckor att få</li>
              <li>- BankID kräver svenskt personnummer och bankkonto</li>
              <li>- Många tjänster fungerar inte utan BankID</li>
              <li>- Spara alla kvitton och dokument digitalt</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
