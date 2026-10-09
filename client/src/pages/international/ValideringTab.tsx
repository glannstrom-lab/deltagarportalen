/**
 * Räknas det du redan kan? — bedömning av utländsk utbildning och legitimation.
 *
 * Ersätter `VisaGuideTab` (beslut Mikael 2026-08-20). Den fliken var skriven
 * för någon utanför Sverige som redan hade ett jobberbjudande, och innehöll
 * belopp som förfallit: "minst 13 000 kr/mån" var försörjningskravet fram till
 * november 2023. Sex granskare hittade fel i lönegolv, handläggningstider,
 * anställningstid för EU-blåkort, giltighetstid för företagartillstånd och
 * tiden till medborgarskap — samtliga hårdkodade utan datumstämpel.
 *
 * REGELN HÄR: inga belopp, inga handläggningstider, inga årtal om tillstånd.
 * De indexeras och ändras minst årligen; myndigheten har alltid rätt siffra.
 * Sidan säger vad som finns, vem som prövar det, och länkar dit.
 *
 * Alla länkar kontrollerade 2026-08-20 (HTTP 200 utan omdirigering till
 * startsidan). Den gamla Migrationsverket-URL:en gav 200 men landade på
 * förstasidan — en mjuk 404, som är värre än en hård eftersom inget larmar.
 *
 * Designpass 2026-10-09: varje kort visar en rad och länken. Förklaringarna
 * ligger kvar ordagrant, men bakom "Läs mer" — inget är borttaget.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { GraduationCap, Stethoscope, FileCheck, Info, ExternalLink, ArrowRight } from '@/components/ui/icons'
import { Card } from '@/components/ui'
import { KONTROLLERAD } from '../International'
import { LasMer } from '@/components/ui/LasMer'

const LANKAR = {
  uhr: 'https://www.uhr.se/bedomning-av-utlandsk-utbildning/',
  socialstyrelsen: 'https://legitimation.socialstyrelsen.se/',
  skolverket: 'https://www.skolverket.se/kompetensutveckling/legitimation',
  arbetsformedlingen: 'https://arbetsformedlingen.se/for-arbetssokande',
  mvArbetstillstand: 'https://www.migrationsverket.se/du-vill-ansoka/arbeta/anstalld-eller-egen-foretagare/anstalld.html',
  mvEu: 'https://www.migrationsverket.se/du-vill-ansoka/medborgare-i-eu-ees-eller-norden/eu-ees-medborgare.html',
  mvUndantag: 'https://www.migrationsverket.se/du-vill-ansoka/arbeta/vissa-far-arbeta-i-sverige-utan-arbetstillstand.html',
} as const

function Ytterlank({ href, children }: { href: string; children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline"
    >
      {/* Inte inline-flex: då hamnar ikonen långt till höger när texten
          bryts i ett smalt kort. Inline håller den vid sista ordet. */}
      {children}
      <ExternalLink className="inline-block w-3 h-3 ml-1 align-baseline" aria-hidden="true" />
      <span className="sr-only">{t('international.opensInNewTab')}</span>
    </a>
  )
}

function Ikon({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 flex items-center justify-center shrink-0">
      {children}
    </div>
  )
}

const KORT = 'p-5 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
const IKON = 'w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]'
const RUBRIK = 'font-semibold text-stone-900 dark:text-stone-100 mb-1'
const RAD = 'text-sm text-stone-700 dark:text-stone-200 mb-2'

export default function ValideringTab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      {/* UHR */}
      <Card className={KORT}>
        <div className="flex items-start gap-3">
          <Ikon><GraduationCap className={IKON} aria-hidden="true" /></Ikon>
          <div className="min-w-0">
            <h2 className={RUBRIK}>{t('international.validation.uhr.title')}</h2>
            <p className={RAD}>
              {t('international.validation.uhr.lead', 'UHR skriver gratis vad din utbildning motsvarar i Sverige.')}
            </p>
            <Ytterlank href={LANKAR.uhr}>{t('international.validation.uhr.link')}</Ytterlank>
            <LasMer>
              <p>{t('international.validation.uhr.body')}</p>
              <p>{t('international.validation.uhr.tip')}</p>
            </LasMer>
          </div>
        </div>
      </Card>

      {/* Reglerade yrken */}
      <Card className={KORT}>
        <div className="flex items-start gap-3">
          <Ikon><Stethoscope className={IKON} aria-hidden="true" /></Ikon>
          <div className="min-w-0">
            <h2 className={RUBRIK}>{t('international.validation.regulated.title')}</h2>
            <p className={RAD}>
              {t('international.validation.regulated.lead', 'Många yrken i vården och skolan kräver svensk legitimation.')}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Ytterlank href={LANKAR.socialstyrelsen}>
                {t('international.validation.regulated.healthLink')}
              </Ytterlank>
              <Ytterlank href={LANKAR.skolverket}>
                {t('international.validation.regulated.teacherLink')}
              </Ytterlank>
            </div>
            <LasMer>
              <p>{t('international.validation.regulated.body')}</p>
              <p>{t('international.validation.regulated.health')}</p>
              <p>{t('international.validation.regulated.teacher')}</p>
              <p>
                {t('international.validation.regulated.other')}{' '}
                <Ytterlank href={LANKAR.arbetsformedlingen}>Arbetsförmedlingen</Ytterlank>
              </p>
            </LasMer>
          </div>
        </div>
      </Card>

      {/* Arbetstillstånd — utan siffror, med rätt väg vidare */}
      <Card className={KORT}>
        <div className="flex items-start gap-3">
          <Ikon><FileCheck className={IKON} aria-hidden="true" /></Ikon>
          <div className="min-w-0 flex-1">
            <h2 className={`${RUBRIK} mb-2`}>{t('international.validation.permit.title')}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              <li className="p-3 rounded-lg bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/40">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {t('international.validation.permit.euShort', 'Medborgare i EU/EES eller Norden')}
                </p>
                <p className={RAD}>
                  {t('international.validation.permit.euAnswer', 'Du behöver inget tillstånd.')}
                </p>
                <Ytterlank href={LANKAR.mvEu}>{t('international.validation.permit.linkEu')}</Ytterlank>
              </li>
              <li className="p-3 rounded-lg bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {t('international.validation.permit.thirdShort', 'Medborgare i ett land utanför EU/EES')}
                </p>
                <p className={RAD}>
                  {t('international.validation.permit.thirdAnswer', 'Oftast krävs arbetstillstånd.')}
                </p>
                <div className="flex flex-col gap-1">
                  <Ytterlank href={LANKAR.mvArbetstillstand}>
                    {t('international.validation.permit.linkPermit')}
                  </Ytterlank>
                  <Ytterlank href={LANKAR.mvUndantag}>
                    {t('international.validation.permit.linkException')}
                  </Ytterlank>
                </div>
              </li>
            </ul>
            <LasMer>
              <p>{t('international.validation.permit.eu')}</p>
              <p>{t('international.validation.permit.thirdCountry')}</p>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('international.validation.permit.noNumbers')}
              </p>
            </LasMer>
          </div>
        </div>
      </Card>

      {/* Vägen vidare in i portalen */}
      <Card className="p-5 bg-[var(--c-bg)]/60 dark:bg-[var(--c-bg)]/20 border-[var(--c-accent)]/60">
        <h2 className={RUBRIK}>{t('international.validation.next.title')}</h2>
        <p className="text-sm text-stone-700 dark:text-stone-200 mb-3">
          {t('international.validation.next.body')}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/cv"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline"
          >
            {t('international.validation.next.toCv')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            to="/job-search"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline"
          >
            {t('international.validation.next.toJobSearch')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </Card>

      {/* Datumstämpeln. Utan den kunde felen ligga i tre år utan att någon
          reagerade — inget i gränssnittet inbjöd till att ifrågasätta. */}
      <p className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        {t('international.checkedNote', { date: KONTROLLERAD })}
      </p>
    </div>
  )
}
