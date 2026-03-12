import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Loader2 } from 'lucide-react'

// Wrapper komponent för att hantera redirects med params
function ArticleRedirect() {
  const { id } = useParams()
  return <Navigate to={`/dashboard/knowledge-base/article/${id}`} replace />
}

// Eager-loaded kritiska komponenter
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import StorageTest from './pages/StorageTest'

// Lazy-loaded sidor för bättre prestanda
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
const JobTracker = lazy(() => import('./pages/JobTracker'))
const JobSearch = lazy(() => import('./pages/JobSearch'))
const Career = lazy(() => import('./pages/Career'))
const Diary = lazy(() => import('./pages/Diary'))
const Wellness = lazy(() => import('./pages/Wellness'))
const Exercises = lazy(() => import('./pages/Exercises'))
const Settings = lazy(() => import('./pages/Settings'))
const Resources = lazy(() => import('./pages/Resources'))
const Help = lazy(() => import('./pages/Help'))
const ConsultantDashboard = lazy(() => import('./components/consultant/ConsultantDashboard'))
const SuperAdminPanel = lazy(() => import('./components/admin/SuperAdminPanel'))
const InviteHandler = lazy(() => import('./components/auth/InviteHandler'))

// Loading fallback för lazy-loaded komponenter
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-violet-600 mx-auto mb-3" size={32} />
        <p className="text-sm text-slate-500">Laddar sida...</p>
      </div>
    </div>
  )
}

// Error Boundary wrapper for routes
function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}

// Suspense wrapper med loading state
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  )
}

// Roll-baserad route-guard
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
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Public route - redirect if authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-slate-800">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
    
    // Clear old service worker to fix routing issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log('[App] Unregistering old service worker:', registration.scope)
          registration.unregister()
        })
      })
    }
  }, [initialize])

  // Visa loading-screen medan auth initialiseras
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-slate-800">
        <div className="text-center">
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={48} />
          <p className="text-white/80">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes - eager loaded för snabb initial rendering */}
      <Route path="/" element={
        <PublicRoute>
          <RouteErrorBoundary>
            <Landing />
          </RouteErrorBoundary>
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <RouteErrorBoundary>
            <Login />
          </RouteErrorBoundary>
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RouteErrorBoundary>
            <Register />
          </RouteErrorBoundary>
        </PublicRoute>
      } />
      <Route path="/invite/:code" element={
        <LazyRoute>
          <RouteErrorBoundary>
            <InviteHandler />
          </RouteErrorBoundary>
        </LazyRoute>
      } />
      {/* Landing page preview - accessible even when logged in */}
      <Route path="/landing" element={
        <RouteErrorBoundary>
          <Landing />
        </RouteErrorBoundary>
      } />
      
      {/* Legal pages - public */}
      <Route path="/privacy" element={
        <RouteErrorBoundary>
          <Privacy />
        </RouteErrorBoundary>
      } />
      <Route path="/terms" element={
        <RouteErrorBoundary>
          <Terms />
        </RouteErrorBoundary>
      } />
      {/* Storage test page */}
      <Route path="/test/storage" element={
        <RouteErrorBoundary>
          <StorageTest />
        </RouteErrorBoundary>
      } />
      
      {/* Legal pages - public */}
      <Route path="/privacy" element={
        <RouteErrorBoundary>
          <Privacy />
        </RouteErrorBoundary>
      } />
      <Route path="/terms" element={
        <RouteErrorBoundary>
          <Terms />
        </RouteErrorBoundary>
      } />

      {/* Protected routes - lazy loaded för bättre prestanda */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Dashboard />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
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
        <Route path="interest-guide" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <InterestGuide />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        {/* Knowledge Base - handles tabs via hash routing */}
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
        {/* Article detail view */}
        <Route path="article/:id" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <Article />
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
        <Route path="job-search" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <JobSearch />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="jobs" element={<Navigate to="/job-search" replace />} />
        <Route path="job-tracker" element={
          <LazyRoute>
            <RouteErrorBoundary>
              <JobTracker />
            </RouteErrorBoundary>
          </LazyRoute>
        } />
        <Route path="career" element={
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
        <Route path="wellness" element={
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
        
        {/* Consultant routes */}
        <Route path="consultant" element={
          <PrivateRoute allowedRoles={['CONSULTANT', 'ADMIN', 'SUPERADMIN']}>
            <LazyRoute>
              <RouteErrorBoundary>
                <ConsultantDashboard />
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

      {/* Redirect old routes to new /dashboard routes for backward compatibility */}
      <Route path="/cv" element={<Navigate to="/dashboard/cv" replace />} />
      <Route path="/cover-letter" element={<Navigate to="/dashboard/cover-letter" replace />} />
      <Route path="/job-search" element={<Navigate to="/dashboard/job-search" replace />} />
      <Route path="/career" element={<Navigate to="/dashboard/career" replace />} />
      <Route path="/interest-guide" element={<Navigate to="/dashboard/interest-guide" replace />} />
      <Route path="/exercises" element={<Navigate to="/dashboard/exercises" replace />} />
      <Route path="/diary" element={<Navigate to="/dashboard/diary" replace />} />
      <Route path="/knowledge-base" element={<Navigate to="/dashboard/knowledge-base" replace />} />
      <Route path="/knowledge-base/:id" element={<ArticleRedirect />} />
      <Route path="/knowledge-base/article/:id" element={<Navigate to={`/dashboard/knowledge-base/article/:id`} replace />} />
      <Route path="/resources" element={<Navigate to="/dashboard/resources" replace />} />
      <Route path="/help" element={<Navigate to="/dashboard/help" replace />} />
      
      {/* Legacy article routes - redirect to new knowledge-base structure */}
      <Route path="/article/:id" element={<ArticleRedirect />} />
      <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
      <Route path="/job-tracker" element={<Navigate to="/dashboard/job-tracker" replace />} />
      <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
      <Route path="/consultant" element={<Navigate to="/dashboard/consultant" replace />} />
      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />

      {/* Catch all - redirect to dashboard for client-side routing */}
      <Route path="*" element={
        <Navigate to="/dashboard" replace />
      } />
    </Routes>
  )
}

export default App
