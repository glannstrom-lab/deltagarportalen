import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CVBuilder from './pages/CVBuilder'
import CoverLetter from './pages/CoverLetter'
import InterestGuide from './pages/InterestGuide'
import KnowledgeBase from './pages/KnowledgeBase'
import Article from './pages/Article'
import Profile from './pages/Profile'
import JobTracker from './pages/JobTracker'
import JobSearch from './pages/JobSearch'
import Calendar from './pages/Calendar'
import Wellness from './pages/Wellness'
import Settings from './pages/Settings'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
        <Route path="cover-letter" element={<CoverLetter />} />
        <Route path="interest-guide" element={<InterestGuide />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
        <Route path="knowledge-base/:id" element={<Article />} />
        <Route path="profile" element={<Profile />} />
        <Route path="job-tracker" element={<JobTracker />} />
        <Route path="job-search" element={<JobSearch />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="wellness" element={<Wellness />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
