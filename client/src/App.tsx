import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Loader2 } from 'lucide-react'

// Alla komponenter - NU STATISKA (inte lazy loaded)
// Detta fixar problem med code splitting på Vercel
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CVBuilder from './pages/CVBuilder'
import CoverLetterGenerator from './pages/CoverLetterGenerator'
import InterestGuide from './pages/InterestGuide'
import KnowledgeBase from './pages/KnowledgeBase'
import Article from './pages/Article'
import Profile from './pages/Profile'
import JobTracker from './pages/JobTracker'
import JobSearch from './pages/JobSearch'
import Career from './pages/Career'
import Diary from './pages/Diary'
import Wellness from './pages/Wellness'
import Exercises from './pages/Exercises'
import Settings from './pages/Settings'
import ConsultantDashboard from './components/consultant/ConsultantDashboard'
import SuperAdminPanel from './components/admin/SuperAdminPanel'
import InviteHandler from './components/auth/InviteHandler'

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
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
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
      {/* Public routes */}
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
        <RouteErrorBoundary>
          <InviteHandler />
        </RouteErrorBoundary>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={
          <RouteErrorBoundary>
            <Dashboard />
          </RouteErrorBoundary>
        } />
        <Route path="cv" element={
          <RouteErrorBoundary>
            <CVBuilder />
          </RouteErrorBoundary>
        } />
        <Route path="cover-letter" element={
          <RouteErrorBoundary>
            <CoverLetterGenerator />
          </RouteErrorBoundary>
        } />
        <Route path="interest-guide" element={
          <RouteErrorBoundary>
            <InterestGuide />
          </RouteErrorBoundary>
        } />
        <Route path="knowledge-base" element={
          <RouteErrorBoundary>
            <KnowledgeBase />
          </RouteErrorBoundary>
        } />
        <Route path="knowledge-base/:id" element={
          <RouteErrorBoundary>
            <Article />
          </RouteErrorBoundary>
        } />
        <Route path="profile" element={
          <RouteErrorBoundary>
            <Profile />
          </RouteErrorBoundary>
        } />
        <Route path="jobs" element={
          <RouteErrorBoundary>
            <JobSearch />
          </RouteErrorBoundary>
        } />
        <Route path="job-tracker" element={
          <RouteErrorBoundary>
            <JobTracker />
          </RouteErrorBoundary>
        } />
        <Route path="career" element={
          <RouteErrorBoundary>
            <Career />
          </RouteErrorBoundary>
        } />
        <Route path="diary" element={
          <RouteErrorBoundary>
            <Diary />
          </RouteErrorBoundary>
        } />
        <Route path="wellness" element={
          <RouteErrorBoundary>
            <Wellness />
          </RouteErrorBoundary>
        } />
        <Route path="exercises" element={
          <RouteErrorBoundary>
            <Exercises />
          </RouteErrorBoundary>
        } />
        <Route path="settings" element={
          <RouteErrorBoundary>
            <Settings />
          </RouteErrorBoundary>
        } />
        
        {/* Consultant routes */}
        <Route path="consultant" element={
          <PrivateRoute allowedRoles={['CONSULTANT', 'ADMIN', 'SUPERADMIN']}>
            <RouteErrorBoundary>
              <ConsultantDashboard />
            </RouteErrorBoundary>
          </PrivateRoute>
        } />
        
        {/* Admin routes */}
        <Route path="admin" element={
          <PrivateRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
            <RouteErrorBoundary>
              <SuperAdminPanel />
            </RouteErrorBoundary>
          </PrivateRoute>
        } />
      </Route>

      {/* Catch all - 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
            <p className="text-slate-600 mb-6">Sidan hittades inte</p>
            <a href="/" className="text-teal-600 hover:underline">
              Tillbaka till startsidan
            </a>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App
