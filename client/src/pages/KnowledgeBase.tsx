/**
 * Knowledge Base - Ultra minimal test
 */

import { useState } from 'react'

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState('for-you')
  
  console.log('Rendering KnowledgeBase, activeTab:', activeTab)
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Kunskapsbank TEST</h1>
      
      {/* Debug info */}
      <div style={{ margin: '20px 0', padding: '10px', background: '#f0f0f0' }}>
        <p>Aktiv tab: {activeTab}</p>
      </div>
      
      {/* Simple buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => {
            console.log('CLICK: for-you')
            setActiveTab('for-you')
          }}
          style={{ 
            padding: '10px 20px', 
            background: activeTab === 'for-you' ? 'blue' : 'gray',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          För dig
        </button>
        
        <button 
          onClick={() => {
            console.log('CLICK: topics')
            setActiveTab('topics')
          }}
          style={{ 
            padding: '10px 20px', 
            background: activeTab === 'topics' ? 'blue' : 'gray',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Ämnen
        </button>
        
        <button 
          onClick={() => {
            console.log('CLICK: tools')
            setActiveTab('tools')
          }}
          style={{ 
            padding: '10px 20px', 
            background: activeTab === 'tools' ? 'blue' : 'gray',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Verktyg
        </button>
      </div>
      
      {/* Content */}
      <div style={{ padding: '20px', border: '2px solid #ccc' }}>
        {activeTab === 'for-you' && <p>INNEHÅLL: För dig</p>}
        {activeTab === 'topics' && <p>INNEHÅLL: Ämnen</p>}
        {activeTab === 'tools' && <p>INNEHÅLL: Verktyg</p>}
      </div>
      
      {/* HTML-only test */}
      <div style={{ marginTop: '40px', padding: '20px', background: '#ffeeee' }}>
        <p>HTML-only test (utan React):</p>
        <button onclick="alert('HTML knapp fungerar!')" style={{ padding: '10px' }}>
          Testa HTML-knapp
        </button>
      </div>
    </div>
  )
}
