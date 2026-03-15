import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  FileText,
  Search,
  BookOpen,
  Compass,
  User,
  Menu,
  X,
  BookHeart,
  LogOut,
  Settings,
  Briefcase,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

/**
 * MobileNav - Sidomeny för mobil (hamburger-meny)
 * 
 * Används nu tillsammans med Layout.MobileTopBar som visar
 * meny-knappen i headern istället för bottom navigation.
 */
export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuthStore()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // Alla länkar i sidomenyn
  const menuItems: NavItem[] = [
    { to: '/', label: 'Översikt', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/cv', label: 'CV-byggare', icon: <FileText className="w-5 h-5" /> },
    { to: '/cover-letter', label: 'Personligt brev', icon: <FileText className="w-5 h-5" /> },
    { to: '/interest-guide', label: 'Intresseguiden', icon: <Compass className="w-5 h-5" /> },
    { to: '/job-search', label: 'Sök jobb', icon: <Search className="w-5 h-5" /> },
    { to: '/job-search', label: 'Ansökningar', icon: <FileText className="w-5 h-5" /> },
    { to: '/career', label: 'Karriär', icon: <Briefcase className="w-5 h-5" /> },
    { to: '/knowledge-base', label: 'Kunskapsbank', icon: <BookOpen className="w-5 h-5" /> },
    { to: '/diary', label: 'Dagbok', icon: <BookHeart className="w-5 h-5" /> },
    { to: '/wellness', label: 'Mående', icon: <BookHeart className="w-5 h-5" /> },
    { to: '/profile', label: 'Profil', icon: <User className="w-5 h-5" /> },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // Denna komponent används inte längre direkt för att visa menyn,
  // utan menyn hanteras nu i Layout.MobileTopBar
  // Vi behåller komponenten för bakåtkompatibilitet om den behövs
  return null
}

/**
 * MobileNavSimplified - Minimal navigation för mobil
 * Visar endast viktiga länkar i en sidomeny
 */
export function MobileNavSimplified() {
  // Denna används inte heller längre
  return null
}

/**
 * MobileMenuButton - Knapp för att öppna menyn
 * Används i Layout.MobileTopBar
 */
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
      aria-label="Meny"
    >
      <Menu className="w-6 h-6 text-slate-700" />
    </button>
  )
}

/**
 * MobileProfileButton - Knapp för att öppna profil-menyn
 * Används i Layout.MobileTopBar
 */
export function MobileProfileButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
      aria-label="Profil"
    >
      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
    </button>
  )
}

/**
 * SideMenu - Sidomeny som glider in från höger
 */
export function SideMenu({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  const location = useLocation()
  
  const menuItems: NavItem[] = [
    { to: '/', label: 'Översikt', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/cv', label: 'CV-byggare', icon: <FileText className="w-5 h-5" /> },
    { to: '/cover-letter', label: 'Personligt brev', icon: <FileText className="w-5 h-5" /> },
    { to: '/interest-guide', label: 'Intresseguiden', icon: <Compass className="w-5 h-5" /> },
    { to: '/job-search', label: 'Sök jobb', icon: <Search className="w-5 h-5" /> },
    { to: '/job-search', label: 'Ansökningar', icon: <FileText className="w-5 h-5" /> },
    { to: '/career', label: 'Karriär', icon: <Briefcase className="w-5 h-5" /> },
    { to: '/knowledge-base', label: 'Kunskapsbank', icon: <BookOpen className="w-5 h-5" /> },
    { to: '/diary', label: 'Dagbok', icon: <BookHeart className="w-5 h-5" /> },
    { to: '/wellness', label: 'Mående', icon: <BookHeart className="w-5 h-5" /> },
  ]

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Menu */}
      <div 
        className={cn(
          'fixed top-0 right-0 bottom-0 bg-white z-50 shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'w-[280px] max-w-[80vw]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Meny</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <nav className="p-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                isActive
                  ? 'bg-violet-100 text-violet-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
