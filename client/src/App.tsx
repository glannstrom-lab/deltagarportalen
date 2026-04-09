import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { swLogger } from './lib/logger'
import { Loader2 } from '@/components/ui/icons'

// Wrapper komponent för att hantera redirects med params
function ArticleRedirect() {
  const { id } = useParams()
  return <Navigate to={`/knowledge-base/article/${id}`} replace />
}

// Legacy article redirects
function LegacyArticleRedirect() {
  return <Navigate to="/knowledge-base" replace />
}

// Eager-loaded kritiska komponenter
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import AiPolicy from './pages/AiPolicy'
import CookieConsent from './components/CookieConsent'
import StorageTest from './pages/StorageTest'

// Lazy-loaded sidor
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CVPage = lazy(() => import('./pages/CVPage'))
const CVBuilder = lazy(() => import('./pages/CVBuilder'))
const CoverLetterGenerator = lazy(() => import('./pages/CoverLetterGenerator'))
const CoverLetterPage = lazy(() => import('./pages/CoverLetterPage'))
const InterestGuide = lazy(() => import('./pages/InterestGuide'))
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'))
const Article = lazy(() => import('./pages/Article'))
const Profile = lazy(() => import('./pages/Profile'))
const UnifiedProfile = lazy(() => import('./pages/UnifiedProfile'))
// JobTracker removed - using JobSearch instead
const JobSearch = lazy(() => import('./pages/JobSearch'))
const Career = lazy(() => import('./pages/Career'))
const Diary = lazy(() => import('./pages/Diary'))
const Wellness = lazy(() => import('./pages/Wellness'))
const Exercises = lazy(() => import('./pages/Exercises'))
const Settings = lazy(() => import('./pages/Settings'))
const Resources = lazy(() => import('./pages/Resources'))
const Help = lazy(() => import('./pages/Help'))
const ConsultantDashboard = lazy(() => import('./components/consultant/ConsultantDashboard'))
const Consultant = lazy(() => import('./pages/Consultant'))
const SuperAdminPanel = lazy(() => import('./components/admin/SuperAdminPanel'))
const InviteHandler = lazy(() => import('./components/auth/InviteHandler'))
// New feature pages
const Salary = lazy(() => import('./pages/Salary'))
const International = lazy(() => import('./pages/International'))
const PersonalBrand = lazy(() => import('./pages/PersonalBrand'))
const Journey = lazy(() => import('./pages/Journey'))
const LinkedInOptimizer = lazy(() => import('./pages/LinkedInOptimizer'))
const SkillsGapAnalysis = lazy(() => import('./pages/SkillsGapAnalysis'))
const InterviewSimulator = lazy(() => import('./pages/InterviewSimulator'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Education = lazy(() => import('./pages/Education'))
const Applications = lazy(() => import('./pages/Applications'))
const Spontaneous = lazy(() => import('./pages/Spontaneous'))

// Loading fallback
function PageLoader() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <Loader2 className="animate-spin text-violet-600 mx-auto mb-3" size={32} aria-hidden="true" />
        <p className="text-sm text-slate-500">Laddar sida...</p>
      </div>
    </div>
  )
}

// Error Boundary wrapper
function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}

// Suspense wrapper
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  )
}

// Private route guard
function PrivateRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles?: string[] 
}) {
  const { isAuthenticated, profile, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-slate-800">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

// Public route - redirect if authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  console.log('[DEBUG] 8. PublicRoute rendering')
  const { isAuthenticated, isLoading } = useAuthStore()
  console.log('[DEBUG] 8a. PublicRoute: isAuthenticated=', isAuthenticated, 'isLoading=', isLoading)

  if (isLoading) {
    console.log('[DEBUG] 8b. PublicRoute: showing loader')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-slate-800">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }

  if (isAuthenticated) {
    console.log('[DEBUG] 8c. PublicRoute: redirecting authenticated user')
    return <Navigate to="/" replace />
  }

  console.log('[DEBUG] 8d. PublicRoute: rendering children (Landing)')
  return <>{children}</>
}

function App() {
  console.log('[DEBUG] 7. App component rendering')

  // CRITICAL DEBUG: This div should ALWAYS be visible, even before auth loads
  // If you don't see this red bar, React is not rendering to DOM at all
  const debugElement = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#ff0000',
      color: '#ffffff',
      padding: '20px',
      zIndex: 999999,
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      🔴 DEBUG: Om du ser detta, fungerar React! 🔴
    </div>
  )

  const { initialize, isLoading } = useAuthStore()
  console.log('[DEBUG] 7a. useAuthStore called, isLoading:', isLoading)

  useEffect(() => {
    console.log('[DEBUG] 7b. App useEffect running, calling initialize()')
    initialize()
    
    // Clear old service worker to fix routing issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          swLogger.debug('[App] Unregistering old service worker:', registration.scope)
          registration.unregister()
        })
      })
    }
  }, [initialize])

  // Show loading screen while auth initializes
  if (isLoading) {
    return (
      <>
        {debugElement}
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #0d9488, #1e293b)',
          paddingTop: '60px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Laddar...</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    )
  }

  // TEMPORARY DEBUG: Visible element to confirm React renders
  console.log('[DEBUG] 7c. App rendering main content, isLoading:', isLoading)

  return (
    <>
    {debugElement}
    {/* DEBUG: Test content with inline styles */}
    <div style={{
      marginTop: '80px',
      padding: '20px',
      background: '#22c55e',
      color: 'white',
      fontSize: '24px',
      textAlign: 'center'
    }}>
      🟢 DEBUG: Routes-sektionen renderas! Auth: {String(useAuthStore.getState().isAuthenticated)}
    </div>
    {/* TEST: Element UTANFÖR Routes */}
    <div style={{
      marginTop: '20px',
      padding: '20px',
      background: '#f97316',
      color: 'white',
      fontSize: '20px',
      textAlign: 'center'
    }}>
      🟠 ORANGE: Detta är UTANFÖR Routes, borde alltid synas
    </div>

    <Routes>
      {/* TEMPORARY: Catch-all test route */}
      <Route path="*" element={
        <div style={{
          marginTop: '20px',
          padding: '40px',
          background: '#8b5cf6',
          color: 'white',
          fontSize: '32px',
          textAlign: 'center'
        }}>
          🟣 LILA: Catch-all route matchade! Path: {window.location.hash || window.location.pathname}
        </div>
      } />

      {/* Public routes - TEMPORARILY DISABLED
      <Route path="/" element={
        <PublicRoute>
          <Landing />
        </PublicRoute>
      } /> */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/invite/:code" element={
        <LazyRoute>
          <InviteHandler />
        </LazyRoute>
      } />
      
      {/* Landing page preview */}
      <Route path="/landing" element={<Landing />} />
      
      {/* Legal pages */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/ai-policy" element={<AiPolicy />} />
      <Route path="/test/storage" element={<StorageTest />} />

      {/* Protected routes with Layout */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        {/* Dashboard with tabs - main route */}
        <Route index element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Dashboard />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        
        {/* Other protected routes */}
        <Route path="cv/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <CVPage />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="cover-letter/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <CoverLetterPage />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="interest-guide/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <InterestGuide />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="knowledge-base/article/:id" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Article />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="knowledge-base" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <KnowledgeBase />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="knowledge-base/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <KnowledgeBase />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="profile" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Profile />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="unified-profile" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <UnifiedProfile />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="job-search/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <JobSearch />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="jobs" element={<Navigate to="/job-search" replace />} />
        <Route path="job-tracker/*" element={<Navigate to="/job-search" replace />} />
        <Route path="applications/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Applications />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="spontanansökan/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Spontaneous />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="career/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Career />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="diary" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Diary />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="wellness/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Wellness />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="exercises" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Exercises />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="settings" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Settings />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="resources" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Resources />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="help" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Help />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="journey" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Journey />
            </RouteErrorBoundary>
          </LazyRoute>
        } />

        {/* New feature pages */}
        <Route path="salary/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Salary />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="international/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <International />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="personal-brand/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <PersonalBrand />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="linkedin-optimizer" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <LinkedInOptimizer />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="skills-gap-analysis" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <SkillsGapAnalysis />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="interview-simulator" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <InterviewSimulator />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="calendar" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Calendar />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="education/*" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Education />
            </RouteErrorBoundary>
          </LazyRoute>
        } />

        {/* Consultant routes */}
        <Route path="consultant/*" element={
          <PrivateRoute allowedRoles={['CONSULTANT', 'ADMIN', 'SUPERADMIN']}>
            <LazyRoute>
              <RouteErrorBoundary>
                <Consultant />
              </RouteErrorBoundary>
            </LazyRoute>
          </PrivateRoute>
        } />
        
        {/* Admin routes */}
        <Route path="admin" element={
          <PrivateRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
            <LazyRoute>
              <RouteErrorBoundary>
                <SuperAdminPanel />
              </RouteErrorBoundary>
            </LazyRoute>
          </PrivateRoute>
        } />
      </Route>

      {/* Redirect old dashboard routes */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/dashboard/*" element={<Navigate to="/" replace />} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <CookieConsent />
    </>
  )
}

export default App
