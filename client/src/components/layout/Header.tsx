import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { User } from 'lucide-react'

export function Header() {
  const { user } = useAuthStore()

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-end">
      <Link to="/profile" className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
          <User size={18} className="text-violet-600" />
        </div>
      </Link>
    </header>
  )
}
