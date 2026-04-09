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

// Public route - only show content for unauthenticated users
function PublicRoute({ children, redirectTo = "/" }: { children: React.ReactNode, redirectTo?: string }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-slate-800">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

// Root route - shows Landing for guests, Layout with Dashboard for authenticated users
function RootRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-slate-800">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Landing />
  }

  // Authenticated users see the dashboard inside the layout
  return <Layout />
}

function App() {
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800">
        <div className="text-center">
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={48} />
          <p className="text-white/80">Laddar...</p>
        </div>
      </div>
    )
  }

  // Full routing restored
  return (
    <>
      <Routes>
        {/* Auth routes - redirect if already logged in */}
        <Route path="/login" element={
          <PublicRoute redirectTo="/">
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute redirectTo="/">
            <Register />
          </PublicRoute>
        } />
        <Route path="/invite/:code" element={
          <LazyRoute>
            <InviteHandler />
          </LazyRoute>
        } />

        {/* Legal pages - always accessible */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/ai-policy" element={<AiPolicy />} />

        {/* Root route - shows Landing or Layout based on auth */}
        <Route path="/" element={<RootRoute />}>
          {/* Nested routes for authenticated users */}
          <Route index element={
            <LazyRoute>
              <RouteErrorBoundary>
                <Dashboard />
              </RouteErrorBoundary>
            </LazyRoute>
          } />
          <Route path="cv/*" element={<LazyRoute><RouteErrorBoundary><CVPage /></RouteErrorBoundary></LazyRoute>} />
          <Route path="cover-letter/*" element={<LazyRoute><RouteErrorBoundary><CoverLetterPage /></RouteErrorBoundary></LazyRoute>} />
          <Route path="interest-guide/*" element={<LazyRoute><RouteErrorBoundary><InterestGuide /></RouteErrorBoundary></LazyRoute>} />
          <Route path="knowledge-base/*" element={<LazyRoute><RouteErrorBoundary><KnowledgeBase /></RouteErrorBoundary></LazyRoute>} />
          <Route path="knowledge-base/article/:id" element={<LazyRoute><RouteErrorBoundary><Article /></RouteErrorBoundary></LazyRoute>} />
          <Route path="profile" element={<LazyRoute><RouteErrorBoundary><Profile /></RouteErrorBoundary></LazyRoute>} />
          <Route path="job-search/*" element={<LazyRoute><RouteErrorBoundary><JobSearch /></RouteErrorBoundary></LazyRoute>} />
          <Route path="applications/*" element={<LazyRoute><RouteErrorBoundary><Applications /></RouteErrorBoundary></LazyRoute>} />
          <Route path="career/*" element={<LazyRoute><RouteErrorBoundary><Career /></RouteErrorBoundary></LazyRoute>} />
          <Route path="diary" element={<LazyRoute><RouteErrorBoundary><Diary /></RouteErrorBoundary></LazyRoute>} />
          <Route path="wellness/*" element={<LazyRoute><RouteErrorBoundary><Wellness /></RouteErrorBoundary></LazyRoute>} />
          <Route path="settings" element={<LazyRoute><RouteErrorBoundary><Settings /></RouteErrorBoundary></LazyRoute>} />
          <Route path="resources" element={<LazyRoute><RouteErrorBoundary><Resources /></RouteErrorBoundary></LazyRoute>} />
          <Route path="help" element={<LazyRoute><RouteErrorBoundary><Help /></RouteErrorBoundary></LazyRoute>} />
          <Route path="salary/*" element={<LazyRoute><RouteErrorBoundary><Salary /></RouteErrorBoundary></LazyRoute>} />
          <Route path="education/*" element={<LazyRoute><RouteErrorBoundary><Education /></RouteErrorBoundary></LazyRoute>} />
          <Route path="calendar" element={<LazyRoute><RouteErrorBoundary><Calendar /></RouteErrorBoundary></LazyRoute>} />
          <Route path="journey" element={<LazyRoute><RouteErrorBoundary><Journey /></RouteErrorBoundary></LazyRoute>} />
          <Route path="spontanansökan/*" element={<LazyRoute><RouteErrorBoundary><Spontaneous /></RouteErrorBoundary></LazyRoute>} />
          <Route path="personal-brand/*" element={<LazyRoute><RouteErrorBoundary><PersonalBrand /></RouteErrorBoundary></LazyRoute>} />
          <Route path="linkedin-optimizer" element={<LazyRoute><RouteErrorBoundary><LinkedInOptimizer /></RouteErrorBoundary></LazyRoute>} />
          <Route path="skills-gap-analysis" element={<LazyRoute><RouteErrorBoundary><SkillsGapAnalysis /></RouteErrorBoundary></LazyRoute>} />
          <Route path="interview-simulator" element={<LazyRoute><RouteErrorBoundary><InterviewSimulator /></RouteErrorBoundary></LazyRoute>} />
          <Route path="exercises" element={<LazyRoute><RouteErrorBoundary><Exercises /></RouteErrorBoundary></LazyRoute>} />
          <Route path="international/*" element={<LazyRoute><RouteErrorBoundary><International /></RouteErrorBoundary></LazyRoute>} />
          <Route path="consultant/*" element={
            <PrivateRoute allowedRoles={['CONSULTANT', 'ADMIN', 'SUPERADMIN']}>
              <LazyRoute><RouteErrorBoundary><Consultant /></RouteErrorBoundary></LazyRoute>
            </PrivateRoute>
          } />
          <Route path="admin" element={
            <PrivateRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
              <LazyRoute><RouteErrorBoundary><SuperAdminPanel /></RouteErrorBoundary></LazyRoute>
            </PrivateRoute>
          } />
        </Route>

        {/* Legacy redirects */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/dashboard/*" element={<Navigate to="/" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsent />
    </>
  )
}

export default App
