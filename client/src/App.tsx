import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Loader2 } from 'lucide-react'

// Eager loaded components (kritiskt för initial load)
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

// Lazy loaded components (code splitting)
const CVBuilder = lazy(() => import('./pages/CVBuilder'))
const CoverLetterGenerator = lazy(() => import('./pages/CoverLetterGenerator'))
const InterestGuide = lazy(() => import('./pages/InterestGuide'))
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'))
const Article = lazy(() => import('./pages/Article'))
const Profile = lazy(() => import('./pages/Profile'))
const JobTracker = lazy(() => import('./pages/JobTracker'))
const JobSearch = lazy(() => import('./pages/JobSearch'))
const Career = lazy(() => import('./pages/Career'))
const Diary = lazy(() => import('./pages/Diary'))
const Wellness = lazy(() => import('./pages/Wellness'))
const Exercises = lazy(() => import('./pages/Exercises'))
const Settings = lazy(() => import('./pages/Settings'))
const ConsultantDashboard = lazy(() => import('./components/consultant/ConsultantDashboard'))
const SuperAdminPanel = lazy(() => import('./components/admin/SuperAdminPanel'))
const InviteHandler = lazy(() => import('./components/auth/InviteHandler'))

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
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
    return <Navigate to="/" replace />
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
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary>
      <Routes>
        {/* Publika routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/invite/:token" 
          element={
            <Suspense fallback={<PageLoader />}>
              <InviteHandler />
            </Suspense>
          } 
        />
        
        {/* Huvudapplikationen */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          
          {/* Lazy loaded routes */}
          <Route path="cv" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <CVBuilder />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="cv-builder" element={<Navigate to="/cv" replace />} />
          
          <Route path="cover-letter" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <CoverLetterGenerator />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="cover-letter-generator" element={<Navigate to="/cover-letter" replace />} />
          <Route path="brev" element={<Navigate to="/cover-letter" replace />} />
          
          <Route path="interest-guide" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <InterestGuide />
              </Suspense>
            </RouteErrorBoundary>
          } />
          
          <Route path="knowledge-base" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <KnowledgeBase />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="knowledge-base/:id" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Article />
              </Suspense>
            </RouteErrorBoundary>
          } />
          
          <Route path="profile" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            </RouteErrorBoundary>
          } />
          
          <Route path="job-tracker" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <JobTracker />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="job-search" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <JobSearch />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="jobs" element={<Navigate to="/job-search" replace />} />
          
          <Route path="career" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Career />
              </Suspense>
            </RouteErrorBoundary>
          } />
          
          <Route path="diary" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Diary />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="calendar" element={<Navigate to="/diary" replace />} />
          
          <Route path="wellness" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Wellness />
              </Suspense>
            </RouteErrorBoundary>
          } />
          
          <Route path="exercises" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Exercises />
              </Suspense>
            </RouteErrorBoundary>
          } />
          
          <Route path="settings" element={
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            </RouteErrorBoundary>
          } />
        </Route>
        
        {/* Konsulent Dashboard */}
        <Route
          path="/consultant/*"
          element={
            <PrivateRoute allowedRoles={['CONSULTANT', 'ADMIN', 'SUPERADMIN']}>
              <Suspense fallback={<PageLoader />}>
                <ConsultantDashboard />
              </Suspense>
            </PrivateRoute>
          }
        />
        
        {/* Superadmin Panel */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <Suspense fallback={<PageLoader />}>
                <SuperAdminPanel />
              </Suspense>
            </PrivateRoute>
          }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
