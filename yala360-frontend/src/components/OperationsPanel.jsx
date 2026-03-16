import React from 'react';

export default function OperationsPanel({ sightings, safariCount, blockTraffic }) {
  const pendingSightings = sightings.filter(s => s.delayUntil && Date.now() < s.delayUntil);
  
  return (
    <div className="operations-panel" style={{ color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
      <h3 style={{ color: '#ef4444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
        <i className="ph ph-target"></i> Field Operations
      </h3>
      
      <div className="op-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Delayed</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{pendingSightings.length}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Jeeps</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{safariCount}</div>
        </div>
      </div>

      <div className="alert-feed">
        <h4 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Recent Activity</h4>
        {pendingSightings.length > 0 ? (
          pendingSightings.map(s => (
            <div key={s.id} style={{ 
              padding: '10px', 
              background: 'rgba(239, 68, 68, 0.05)', 
              borderLeft: '3px solid #ef4444', 
              marginBottom: '8px',
              fontSize: '12px'
            }}>
              <strong>{s.animal}</strong> detected in Block {s.block}
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Verification Required • {new Date(s.time).toLocaleTimeString()}</div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '12px', color: '#22c55e', padding: '10px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '6px' }}>
            <i className="ph ph-check-circle"></i> Map status optimal. No alerts.
          </div>
        )}
      </div>

      <div className="block-status" style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Block Saturation</h4>
        {Object.entries(blockTraffic).map(([block, count]) => (
          <div key={block} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span>{block}</span>
            <span style={{ color: count > 8 ? '#ef4444' : '#94a3b8' }}>{count} Jeeps</span>
          </div>
        ))}
      </div>
    </div>
  );
}
