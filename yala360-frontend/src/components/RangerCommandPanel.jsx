import React from 'react';

export default function RangerCommandPanel({ sightings, activeFilters }) {
  const pendingSightings = sightings.filter(s => s.delayUntil && Date.now() < s.delayUntil);
  
  return (
    <div className="ranger-command-panel">
      <h2><i className="ph ph-shield-check"></i> Command Center</h2>
      
      <div className="status-grid">
        <div className="status-card">
          <div className="label">Verification Queue</div>
          <div className={`value ${pendingSightings.length > 0 ? 'alert' : ''}`}>
            {pendingSightings.length}
          </div>
        </div>
        
        <div className="status-card">
          <div className="label">Patrol Status</div>
          <div className="value">3 Units Active</div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Tactical Actions</h3>
        <button className="map-btn active" style={{width: '100%', marginBottom: '10px', background: '#dc2626'}}>
          <i className="ph ph-megaphone"></i> Broadcast Alert
        </button>
        <button className="map-btn" style={{width: '100%', marginBottom: '10px'}}>
          <i className="ph ph-shield-warning"></i> Restrict Area
        </button>
      </div>

      {pendingSightings.length === 0 && (
        <div className="all-clear-banner">
          <i className="ph ph-check-circle"></i> <strong>ALL CLEAR</strong>
          <div style={{fontSize: '11px', marginTop: '4px'}}>No pending verifications required.</div>
        </div>
      )}

      <div className="pending-list">
        <h3>Pending Verifications</h3>
        {pendingSightings.map(s => (
          <div key={s.id} className="status-card" style={{marginBottom: '10px', fontSize: '12px'}}>
            <div style={{fontWeight: 'bold', color: '#ef4444'}}>{s.animal} Report</div>
            <div>Coords: {s.exactLocation?.lat.toFixed(4)}, {s.exactLocation?.lng.toFixed(4)}</div>
            <div style={{color: '#94a3b8', fontSize: '10px'}}>{new Date(s.time).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
