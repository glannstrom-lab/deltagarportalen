import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Menu, X, User, Settings, LogOut, ChevronDown, HelpCircle, Search
} from '@/components/ui/icons'
import { Sidebar } from './layout/Sidebar'
import { TopBar } from './layout/TopBar'
import { MobileBackButton } from './MobileBackButton'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'
import { SkipLinks } from './SkipLinks'
import CrisisSupport from './CrisisSupport'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { RadgivarTipsApiContext, VisadeTipsContext } from './radgivare/radgivarKontext'
import { useMobileOptimizer } from './MobileOptimizer'
import { useAuthStore } from '@/stores/authStore'
import { NotificationBell } from './notifications/NotificationBell'
import { OptimizedImage } from './ui/OptimizedImage'
import { navGroups, adminNavItems, consultantNavItems, shouldShowBadge, registreraBesok, markFeatureVisited } from './layout/navigation'
import { HubBottomNav } from './layout/HubBottomNav'
import { OnboardingFlow } from './onboarding/OnboardingFlow'
import { SamlingarFab } from './SamlingarFab'
// Steg 1 i navigationsomläggningen (2026-08-17): Ctrl/⌘ K når alla 25
// undersidor utan att man behöver veta vilken hub de ligger i. Fristående —
// rör ingen layout, och fungerar lika bra före som efter toppnaven.
import CommandPalette from './CommandPalette'
// Steg 2: tvåradig toppnav bakom VITE_TOPNAV_ENABLED. Av som default —
// navigationen är chrome och träffar alla 25 sidor samtidigt, så flaggan gör
// den atomära ändringen reversibel med en miljövariabel i stället för en revert.
import { SubNav } from './layout/TopNav'
import { oppnaPalett } from '@/lib/palettEvent'
// Steg 4 (2026-08-17): rådgivarna som kolumn i stället för flytande cirkel.
// FAB:en täckte innehåll på 17 av 19 verktygssidor, inklusive
// GDPR-kontrollerna i Inställningar (fynd F25).
const RadgivarPanel = lazy(() => import('./radgivare/RadgivarPanel'))
// Fokusläget som fällbar panel under rådgivarna. Lazy av samma skäl som
// panelen ovan: den syns bara på breda skärmar och behöver inte ligga i
// entry-bundlen.
const LugnarePanel = lazy(() => import('./radgivare/LugnarePanel'))
import { isTopNavEnabled } from '@/config/features'
// Frågas innan kolumnen reserveras — se `harRadgivare` nedan. Egen liten modul
// just för att slippa dra in rådgivartexten (43 kB) i entry-bundlen.
import { harRadgivarinnehall } from '@/data/radgivarRutter'
// TG1 (2026-08-17): båda off-canvas-panelerna låg alltid i DOM och flyttades
// bara med `translate-x-full` — utan `inert`, utan fokusfälla, utan Escape.
// Hooken finns sedan tidigare och gör allt tre; den behövde bara kopplas in.
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useSettingsStore } from '@/stores/settingsStore'



const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

export default function Layout() {
  const { isMobile } = useMobileOptimizer()
  const location = useLocation()

  /**
   * Besökshistoriken skrivs här, inte i `Sidebar`.
   *
   * Fram till 2026-08-18 låg anropet bara i `Sidebar.tsx` — och sidomenyn
   * renderas inte när toppnaven är på, vilket den är som default sedan
   * `c7c11ca2`. Följden: ingen historik skrevs någonsin i drift, Översiktens
   * rad 2 fastnade permanent på fallbacken "Börja här", och "Ny!"-brickan
   * kunde aldrig sluta visas. `Layout` renderas på varje inloggad sida i båda
   * navigationslägena, så det är den enda platsen där anropet säkert körs.
   */
  useEffect(() => {
    registreraBesok(location.pathname)
    markFeatureVisited(location.pathname)
  }, [location.pathname])

  // Sidebar collapsed state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return stored === 'true'
  })

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue))
      return newValue
    })
  }

  // Visa TopBar och BottomBar på alla sidor förutom login/register
  const showBars = !['/login', '/register'].includes(location.pathname)

  // Bestäm om vi ska visa tillbaka-knapp (DESIGN.md §9 — på alla undersidor
  // UTOM hub-rotsidor där användaren använder HubBottomNav istället)
  const HUB_ROOT_PATHS = ['/', '/oversikt', '/jobb', '/karriar', '/resurser', '/min-vardag']
  const showBackButton = isMobile && !HUB_ROOT_PATHS.includes(location.pathname)

  // FAQ + Crisis Support moved into TopBar; BottomBar removed.
  // HubBottomNav renders on mobile (hub-nav är permanent sedan 2026-07-10, C3).
  const showHubBottomNav = isMobile && showBars

  // Steg 2 (2026-08-17). Läses en gång här i stället för i varje gren nedan,
  // så att det går att se på ett ställe vad flaggan styr.
  const topNav = isTopNavEnabled()

  // Samma inställning som styrde coach-FAB:en. Den som stängt av rådgivaren
  // ska inte få tillbaka den av en omdesign.
  const radgivareAv = !useSettingsStore((st) => st.showCoachWidget)

  // Sidor som redan har en egen högerkolumn renderar rådgivaren SJÄLVA, där
  // den hör hemma bredvid innehållet. CV-byggaren har rail + formulär +
  // förhandsvisning; en fjärde kolumn från Layout hade gjort raden obrukbar.
  const EGEN_RADGIVARE = ['/cv']
  const sidanHarEgen = EGEN_RADGIVARE.some(
    (pfx) => location.pathname === pfx || location.pathname.startsWith(pfx + '/')
  )
  // Sex sidor har ingen rådgivare alls: de fyra hubbarna, /nätverk och /help.
  // Fram till 2026-08-18 reserverade griden ändå 300 px + 24 px gap åt dem —
  // uppmätt 324 av 1440 px, alltså 22 % av skärmen, tomt, på just de sidor som
  // är ingångar. En tom kolumn ser exakt ut som marginal, vilket är varför den
  // överlevde både omläggningen och genomgången efter den.
  const harRadgivare = harRadgivarinnehall(location.pathname)
  const visaRadgivare = showBars && !radgivareAv && !sidanHarEgen && harRadgivare
  // 1280 px = Tailwinds `xl`, samma brytpunkt som griden nedan använder.
  // Hålls de två isär hamnar panelen i kolumnen men får flödets utgångsläge.
  const radgivarKolumn = useMediaQuery('(min-width: 1280px)')

  // Vilka råd står redan infogade i sidan? Kortet registrerar sitt råd,
  // kolumnen hoppar över det. Utan detta säger de två ytorna samma mening
  // inom samma vy — 17 av 20 sidor renderar det infogade kortet med index 0,
  // alltså exakt det råd kolumnen leder med. Se radgivarKontext.ts.
  const [visadeRad, setVisadeRad] = useState<ReadonlySet<string>>(() => new Set())
  const registrera = useCallback((rad: string) => {
    setVisadeRad((f) => (f.has(rad) ? f : new Set(f).add(rad)))
  }, [])
  const avregistrera = useCallback((rad: string) => {
    setVisadeRad((f) => {
      if (!f.has(rad)) return f
      const n = new Set(f)
      n.delete(rad)
      return n
    })
  }, [])
  // Måste vara stabil: den ligger i registreringseffektens beroendelista, och
  // ett objekt som byter identitet gav en oändlig loop som kraschade sidan.
  const tipsApi = useMemo(() => ({ registrera, avregistrera }), [registrera, avregistrera])

  return (
    <>
      <SkipLinks />
      <div
        className={cn(
          'min-h-screen flex flex-col bg-stone-50 dark:bg-stone-900',
          isMobile ? 'pb-safe' : ''
        )}
      >
        {/* TopBar - full width at top (desktop only) */}
        {showBars && !isMobile && <TopBar />}

        {/* Mobil TopBar med meny och profil */}
        {showBars && isMobile && <MobileTopBar />}

        {/* Steg 2 — undersidesraden.
            Kategorierna (rad 1) ligger inuti TopBar, i samma rad som logga,
            sök och profil — annars blir det tre staplade barer på desktop.
            På mobil ÄR HubBottomNav redan rad 1, så mobilanvändaren möter en
            mindre förändring än desktopanvändaren. */}
        {showBars && topNav && <SubNav />}

        {/* Main area with sidebar and content */}
        <div className="flex-1 flex">
          {/* Desktop Sidebar — döljs i fokusläge via [data-focus-chrome].
              Steg 2: med toppnaven på flyttar navigationen upp, och sidomenyn
              skulle bara upprepa den. Den ligger kvar i koden bakom flaggan så
              att en revert är en miljövariabel. */}
          {!topNav && (
            <div className="hidden lg:block relative" data-focus-chrome="sidebar">
              <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
              />
            </div>
          )}

          {/* Huvudinnehåll */}
          {/* min-w-0 + min-h-0 är kritiskt: utan dem expanderar flex-itemet
              med innehållet (kanban-kolumner, breda tabeller) och tvingar
              hela dokumentet att scrolla horisontellt på mobil. */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Main content */}
            <main
              id="main-content"
              className={cn(
                'flex-1 overflow-auto min-w-0',
                isMobile ? 'p-4' : 'p-6',
                /*
                  Fotutrymme för det fixerade bottennavet. `pb-20` (80 px) stod
                  här med kommentaren "h ~56px + safe-area" — men navet mättes
                  2026-08-21 till **65 px** i prod, och det bär självt
                  `pb-safe`. På en telefon med hemindikator blir navet alltså
                  65 + upp till ~34 px = ca 99 px, mer än de 80 som reserverats,
                  och sidans sista rad hamnar under det. Marginalen följer nu
                  safe-area i stället för att gissa den.

                  (Klassen `.has-mobile-nav` i styles/mobile.css var tänkt för
                  just det här och appliceras aldrig någonstans — det är den
                  som är död, inte paddingen.)

                  Mät om med `node e2e/career-bottennav-hittest.cjs` innan du
                  ändrar talet. Okulär besiktning av en fullPage-skärmbild
                  duger inte: ett `position: fixed`-element renderas där vid
                  dokumentets slut, inte vid vyportens.
                */
                showHubBottomNav && 'pb-[calc(5rem+env(safe-area-inset-bottom))]'
              )}
              tabIndex={-1}
            >
              <div className={cn(
                'mx-auto min-w-0',
                isMobile ? 'max-w-full' : 'sidbredd'
              )}>
                {/* Rådgivaren till höger på breda skärmar. Under xl finns
                    inte plats för en tredje kolumn — där renderas panelen
                    sist i flödet i stället, alltså efter sidans innehåll,
                    aldrig ovanpå det.

                    `iKolumn` säger vilken av de två platserna det blev. I
                    kolumnen står första rådgivaren utfälld; sist i flödet är
                    allt hopfällt, eftersom sidan då redan visat samma
                    rådgivares första tips infogat. Utan skillnaden stod
                    Daniels råd ordagrant två gånger på /resources vid 390 px.
                    CSS räcker inte — det är komponentens utgångsläge som
                    skiljer, inte dess utseende. */}
                <RadgivarTipsApiContext.Provider value={tipsApi}>
                <VisadeTipsContext.Provider value={visadeRad}>
                  <div className={cn(visaRadgivare && 'xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6')}>
                    <div className="min-w-0">
                      <Outlet />
                    </div>
                    {visaRadgivare && (
                      <div className="mt-6 xl:mt-0 space-y-3" data-focus-chrome="radgivare">
                        <Suspense fallback={null}>
                          <RadgivarPanel pathname={location.pathname} iKolumn={radgivarKolumn} />
                        </Suspense>
                        {/* Fokusläget under rådgivarna (2026-08-18, beslut
                            Mikael). Enda vägen in var tidigare en textlös ikon
                            i toppnaven. Panelen ligger utanför Suspense-gränsen
                            ovan: den är liten, den ska inte vänta på
                            rådgivartexten, och den ska finnas kvar även om
                            rådgivaren failar att laddas. */}
                        <Suspense fallback={null}>
                          <LugnarePanel />
                        </Suspense>
                      </div>
                    )}
                  </div>
                </VisadeTipsContext.Provider>
                </RadgivarTipsApiContext.Provider>
              </div>
            </main>
          </div>
        </div>

        {/* Tillbaka-knapp på mobil (alla sidor utom dashboard) */}
        {showBackButton && <MobileBackButton />}

        {/* Hub bottom nav (mobile + flag on) — hub-level navigation only.
            FAQ + Crisis Support live in TopBar.
            data-focus-chrome döljer denna i fokusläge (en sak i taget). */}
        {showHubBottomNav && (
          <div data-focus-chrome="bottom-nav">
            <HubBottomNav />
          </div>
        )}

        {/* Övriga komponenter */}
        <BreakReminder workDuration={15} />
        <ToastContainer />

        {/* Kommandopaletten. Renderar ingenting förrän Ctrl/⌘ K trycks, så den
            kostar inget för den som aldrig använder den. */}
        <CommandPalette />

        {/* Steg 4 (2026-08-17): coach-FAB:en är borttagen. Rådgivarna ligger
            numera i en kolumn till höger, i dokumentflödet — se ovan.
            GlobalCoachWidgetContent och CoachWidget är kvar orörda i koden
            tills panelen fått gå ett tag i drift. */}

        {/* Steg 4: "Mina samlingar" var den andra flytande widgeten (F25) och
            gick till skillnad från coach-FAB:en INTE att stänga av. Den täckte
            innehåll på 17 av 19 verktygssidor. Kvar bara på mobil, där det inte
            finns någon toppnav att lägga den i — på desktop når man samlingarna
            via Resurser i rad 1 och via Ctrl/⌘ K. */}
        {isMobile && <SamlingarFab />}

        {/* Global welkomstmodal — visas bara om profile.onboarding_completed === false */}
        <OnboardingFlow />
      </div>
    </>
  )
}

// Mobil topbar med meny-knapp och profil
function MobileTopBar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  // TG1: fokusfälla + Escape + fokusåterställning för profilpanelen.
  const profilPanelRef = useFocusTrap<HTMLDivElement>(isProfileOpen, {
    onEscape: () => setIsProfileOpen(false),
  })

  // På sidor som visar MobileBackButton (icke-hub-rot) måste loggan ge plats
  // för den 44px floatande knappen i övre vänstra hörnet.
  const HUB_ROOT_PATHS = ['/', '/oversikt', '/jobb', '/karriar', '/resurser', '/min-vardag']
  const showsBackButton = !HUB_ROOT_PATHS.includes(location.pathname)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Header */}
      <header className={cn(
        'sticky top-0 z-30 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700/50 py-2 safe-top',
        showsBackButton ? 'pl-[60px] pr-3' : 'px-3'
      )}>
        <div className="flex items-center justify-between">
          {/* Vänster: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <OptimizedImage
              src="/logo-icon.svg"
              alt="Jobin"
              loading="eager"
              className="h-7 w-7 object-contain"
            />
            {/* Ordbilden får inte plats bredvid tillbakaknappen. Headern gör
                redan plats med `pl-[60px]`, men de fem ikonerna till höger
                tar sitt — kvar blev 34 px till "jobin.se", som därför
                klipptes mitt i ordet på varje undersida. Symbolen räcker som
                identitet; länken har namn via bildens alt. */}
            {!showsBackButton && (
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                jobin<span className="text-[var(--c-text)] dark:text-[var(--c-solid)]">.se</span>
              </span>
            )}
          </Link>

          {/* Höger: Krishjälp + Notifikationer + Profil + Meny.
              Notifikationer + Meny döljs i fokusläge (en sak i taget);
              CrisisSupport och Profil behålls för tillgänglighet. */}
          <div className="flex items-center gap-0.5">
            {/* Sök — mobilens enda väg in i kommandopaletten. Det finns inget
                tangentbord att trycka Ctrl+K på här, så utan den här knappen
                är paletten helt onåbar på den enhet målgruppen använder mest. */}
            <button
              type="button"
              onClick={oppnaPalett}
              aria-label={t('palette.placeholder', 'Sök efter en sida eller ett verktyg')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
            >
              <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>
            <CrisisSupport variant="inline" />
            <div data-focus-chrome="topbar-extras">
              <NotificationBell variant="compact" />
            </div>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label={t('nav.profile')}
            >
              <div className="w-6 h-6 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 rounded-lg flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
              </div>
            </button>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label={t('sidebar.menu')}
            >
              <Menu className="w-5 h-5 text-stone-600 dark:text-stone-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Meny overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidomeny (höger) - Huvudnavigation synkad med Desktop Sidebar */}
      <MobileMainMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Profil overlay */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsProfileOpen(false)}
        />
      )}

      {/* Profil-meny (vänster).

          TG1: panelen renderas ALLTID och flyttas bara ut ur bild med
          `-translate-x-full`. Utanför skärmen är den fortfarande fokuserbar,
          så tangentbordsanvändare tabbade genom fyra osynliga stopp här (och
          ~32 till i huvudmenyn) innan de nådde sidans innehåll. `inert` tar
          bort hela trädet ur fokusordningen OCH ur tillgänglighetsträdet när
          den är stängd — en enda attributrad gör det villkorlig rendering
          hade gjort, utan att tappa utglidningsanimationen. WCAG 2.4.3. */}
      <div
        ref={profilPanelRef}
        inert={!isProfileOpen}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.profile')}
        className={cn(
          'fixed top-0 left-0 bottom-0 bg-white dark:bg-stone-900 z-50 shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'w-[260px] max-w-[80vw]',
          isProfileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Profil header */}
        <div className="flex items-center justify-between p-3 border-b border-stone-200 dark:border-stone-700/50 safe-top">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">{t('nav.profile')}</h2>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          </button>
        </div>

        {/* Profil-info */}
        <div className="p-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">{user?.email || t('roles.user')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('roles.participant')}</p>
            </div>
          </div>

          <nav className="space-y-0.5">
            <Link
              to="/profile"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm"
            >
              <User className="w-4 h-4 text-stone-400" />
              {t('topbar.profile')}
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm"
            >
              <Settings className="w-4 h-4 text-stone-400" />
              {t('nav.settings')}
            </Link>
          </nav>
        </div>

        {/* Logga ut */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-stone-200 dark:border-stone-700/50 safe-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </>
  )
}

/**
 * MobileMainMenu - Fullständig navigation med alla sidor grupperade
 * Synkad med Desktop Sidebar via navGroups
 */
/**
 * Mobilens huvudmeny.
 *
 * Exporterad sedan TG1 (2026-08-17) enbart för att kunna testas. Panelen håller
 * ~32 fokuserbara element och låg alltid i DOM utan `inert`; att den inte gick
 * att rendera isolerat var en del av varför det aldrig fångades. Använd den
 * inte utanför `Layout` — den förutsätter Layouts router- och authkontext.
 */
export function MobileMainMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  // Alla grupper utfällda som default — tidigare default ('overview'/'job-search')
  // matchade inga faktiska grupp-id:n (action/reflection/outbound) så menyn
  // startade helt hopfälld (upptäckt av spar-c-verify 2026-07-10)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['action', 'reflection', 'outbound'])

  const activeRole = profile?.activeRole || profile?.role || 'USER'
  const isSuperAdmin = activeRole === 'SUPERADMIN'
  const isAdmin = activeRole === 'ADMIN' || isSuperAdmin
  const isConsultant = activeRole === 'CONSULTANT' || isAdmin

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  // TG1: fokusfälla + Escape + fokusåterställning. Hooken är projektets
  // etablerade mönster (13 modaler använder den) — ingen ny mekanik införs här.
  const menyPanelRef = useFocusTrap<HTMLDivElement>(isOpen, { onEscape: onClose })

  return (
    <div
      ref={menyPanelRef}
      /* TG1: se kommentaren vid profilpanelen. Här väger den tyngst — de tre
         navgrupperna startar utfällda (medvetet, se `expandedGroups` ovan), så
         panelen håller ~32 fokuserbara element. Utan `inert` var de alla
         tabbstopp på VARJE sida i appen, inte bara i Min vardag-området som
         planen antog.

         Panelen hade redan `role="dialog" aria-modal="true"` men ingen
         fokusfälla och ingen Escape-hantering — en dialog som utger sig för
         att vara modal men inte är det är sämre än ingen märkning alls, för
         skärmläsaren lovar användaren något appen inte höll. */
      inert={!isOpen}
      className={cn(
        'fixed top-0 right-0 bottom-0 bg-white dark:bg-stone-900 z-50 shadow-xl',
        'transform transition-transform duration-300 ease-out',
        'w-[280px] max-w-[85vw] flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t('sidebar.menu')}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-stone-200 dark:border-stone-700/50 safe-top shrink-0">
        <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">{t('sidebar.menu')}</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4 text-stone-500 dark:text-stone-400" />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.id)

          return (
            <div key={group.id} className="mb-1">
              {/* Group Header - Expandable */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors"
                aria-expanded={isGroupExpanded}
              >
                <span>{t(group.labelKey, group.fallbackLabel)}</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform',
                    !isGroupExpanded && '-rotate-90'
                  )}
                />
              </button>

              {/* Group Items */}
              {isGroupExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                    const showBadge = shouldShowBadge(item)

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
                          isActive
                            ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-accent)] font-medium'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {showBadge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-amber-900 rounded-full">
                            {t('common.new')}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Consultant Section */}
        {isConsultant && (
          <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700/50">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              {t('sidebar.consultantSection')}
            </p>
            <div className="space-y-0.5">
              {consultantNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
                      isActive
                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                        : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-stone-800'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700/50">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {t('sidebar.adminSection')}
            </p>
            <div className="space-y-0.5">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-stone-800'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer - Settings, Help, Logout */}
      <div className="shrink-0 p-2 border-t border-stone-200 dark:border-stone-700/50 safe-bottom space-y-0.5">
        <Link
          to="/settings"
          onClick={onClose}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
            location.pathname === '/settings'
              ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-accent)] font-medium'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>{t('nav.settings')}</span>
        </Link>
        <Link
          to="/help"
          onClick={onClose}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
            location.pathname === '/help'
              ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-accent)] font-medium'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
          )}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('nav.help', 'Hjälp')}</span>
        </Link>
        <button
          onClick={() => {
            onClose()
            signOut()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  )
}
