import { useAuthStore } from '@/stores/authStore'

export default function OverviewTab() {
  const { user } = useAuthStore()

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
        Hej, {user?.firstName || 'dar'}!
      </h1>
      <p style={{ color: '#475569', marginTop: '8px' }}>
        Valkommen till din oversikt.
      </p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginTop: '24px'
      }}>
        <h2 style={{ fontWeight: 600, color: '#1e293b' }}>Din progress</h2>
        <p style={{ color: '#475569', marginTop: '8px' }}>
          Har kommer widgets visas snart.
        </p>
      </div>
    </div>
  )
}
