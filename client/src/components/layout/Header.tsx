import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { User } from '@/components/ui/icons'

export function Header() {
  const { user } = useAuthStore()

  return (
    <header className="h-16 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-700 px-8 flex items-center justify-end">
      <Link to="/profile" className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-stone-700 dark:text-stone-400">{user?.email}</p>
        </div>
        <div className="w-9 h-9 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)] rounded-full flex items-center justify-center">
          <User size={18} className="text-[var(--c-text)] dark:text-[var(--c-solid)]" />
        </div>
      </Link>
    </header>
  )
}
