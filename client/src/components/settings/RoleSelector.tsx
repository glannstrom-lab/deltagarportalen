import { useState } from 'react'
import { useAuthStore, type UserRole } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { 
  User, 
  Users, 
  Shield, 
  Crown,
  CheckCircle2,
  AlertCircle
} from '@/components/ui/icons'

const roleConfig: Record<UserRole, {
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}> = {
  USER: {
    label: 'Deltagare',
    description: 'Standardvy för arbetssökande',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  CONSULTANT: {
    label: 'Konsulent',
    description: 'Hantera dina deltagare och se deras framsteg',
    icon: Users,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  ADMIN: {
    label: 'Admin',
    description: 'Systemadministration och användarhantering',
    icon: Shield,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  SUPERADMIN: {
    label: 'Superadmin',
    description: 'Fullständig systemåtkomst',
    icon: Crown,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
}

export function RoleSelector() {
  const { profile, setActiveRole, updateProfile } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const userRoles = profile?.roles || [profile?.role || 'USER']
  const activeRole = profile?.activeRole || profile?.role || 'USER'

  const handleRoleChange = async (role: UserRole) => {
    setActiveRole(role)
  }

  const handleSaveRoles = async () => {
    setIsSaving(true)
    const result = await updateProfile({ 
      roles: selectedRoles,
      role: selectedRoles[0], // Huvudroll är första i listan
    })
    setIsSaving(false)
    
    if (!result.error) {
      setIsEditing(false)
    }
  }

  const toggleRole = (role: UserRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Roll och behörigheter</h3>
        <p className="text-sm text-slate-700 mt-1">
          Välj vilken roll du vill använda just nu. Dina tillgängliga roller bestämmer vilka funktioner du har tillgång till.
        </p>
      </div>

      {/* Active Role Selector */}
      <div className="p-6 space-y-4">
        <h4 className="text-sm font-medium text-slate-700">Aktiv roll</h4>
        <div className="grid gap-3">
          {userRoles.map((role) => {
            const config = roleConfig[role]
            const Icon = config.icon
            const isActive = activeRole === role

            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                  isActive
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  config.bgColor
                )}>
                  <Icon className={cn('w-6 h-6', config.color)} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{config.label}</span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5">{config.description}</p>
                </div>

                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  isActive
                    ? 'border-teal-500 bg-teal-500'
                    : 'border-slate-300'
                )}>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Manage Roles (Endast för Superadmin) */}
      {(userRoles.includes('SUPERADMIN') || userRoles.includes('ADMIN')) && (
        <div className="px-6 pb-6">
          <div className="border-t border-slate-100 pt-6">
            {!isEditing ? (
              <button
                onClick={() => {
                  setSelectedRoles(userRoles)
                  setIsEditing(true)
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Hantera tillgängliga roller
              </button>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Välj roller för detta konto</h4>
                <div className="space-y-2 mb-4">
                  {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                    const config = roleConfig[role]
                    const Icon = config.icon
                    const isSelected = selectedRoles.includes(role)

                    return (
                      <label
                        key={role}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          isSelected
                            ? 'border-teal-300 bg-teal-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRole(role)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <Icon className={cn('w-5 h-5', config.color)} />
                        <div>
                          <span className="font-medium text-slate-900">{config.label}</span>
                          <p className="text-xs text-slate-700">{config.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveRoles}
                    disabled={isSaving || selectedRoles.length === 0}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Sparar...' : 'Spara roller'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Avbryt
                  </button>
                </div>

                {selectedRoles.length === 0 && (
                  <p className="flex items-center gap-2 text-sm text-amber-600 mt-3">
                    <AlertCircle className="w-4 h-4" />
                    Minst en roll måste väljas
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-1">Om roller</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Du kan ha flera roller samtidigt</li>
              <li>Välj "Aktiv roll" för att byta vy i sidomenyn</li>
              <li>Dina rättigheter är en kombination av alla dina roller</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleSelector
