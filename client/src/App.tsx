import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
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
import Calendar from './pages/Calendar'
import Wellness from './pages/Wellness'
import Exercises from './pages/Exercises'
import Settings from './pages/Settings'
import { ConsultantDashboard } from './components/consultant/ConsultantDashboard'
import { SuperAdminPanel } from './components/admin/SuperAdminPanel'
import { InviteHandler } from './components/auth/InviteHandler'

// Roll-baserad route-guard
function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Publika routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/invite/:token" element={<InviteHandler />} />
      
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
        <Route path="cv" element={<CVBuilder />} />
        <Route path="cv-builder" element={<CVBuilder />} />
        <Route path="cover-letter" element={<CoverLetterGenerator />} />
        <Route path="cover-letter-generator" element={<CoverLetterGenerator />} />
        <Route path="brev" element={<CoverLetterGenerator />} />
        <Route path="interest-guide" element={<InterestGuide />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
        <Route path="knowledge-base/:id" element={<Article />} />
        <Route path="profile" element={<Profile />} />
        <Route path="job-tracker" element={<JobTracker />} />
        <Route path="job-search" element={<JobSearch />} />
        <Route path="jobs" element={<JobSearch />} />
        <Route path="career" element={<Career />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="wellness" element={<Wellness />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Konsulent Dashboard - separat layout */}
      <Route
        path="/consultant/*"
        element={
          <PrivateRoute allowedRoles={['CONSULTANT', 'ADMIN', 'SUPERADMIN']}>
            <ConsultantDashboard />
          </PrivateRoute>
        }
      />
      
      {/* Superadmin Panel - separat layout */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
            <SuperAdminPanel />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default App
