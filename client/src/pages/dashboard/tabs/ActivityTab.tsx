export default function ActivityTab() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
        Min aktivitet
      </h1>
      <p style={{ color: '#475569', marginTop: '8px' }}>
        Har visas dina quests och aktiviteter.
      </p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginTop: '24px'
      }}>
        <h2 style={{ fontWeight: 600, color: '#1e293b' }}>Dagens quests</h2>
        <p style={{ color: '#475569', marginTop: '8px' }}>
          Kommer snart...
        </p>
      </div>
    </div>
  )
}
