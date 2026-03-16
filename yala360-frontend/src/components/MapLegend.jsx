import React, { useState } from 'react';

export default function MapLegend() {
    const [collapsed, setCollapsed] = useState(false);

    const items = [
        { icon: '🚙', label: 'Live Jeep', color: '#F5A623' },
        { icon: '🐆', label: 'Leopard Hotspot', color: '#ff4d4d' },
        { icon: '🔥', label: 'Heatmap Zone', color: '#ef4444' },
        { icon: '📍', label: 'Sighting', color: '#e8941e' },
        { icon: '🚪', label: 'Entrance', color: '#3b82f6' },
        { icon: '🏨', label: 'Hotel / Dining', color: '#8b5cf6' },
        { icon: '📸', label: 'Attraction', color: '#10b981' },
        { icon: '☕', label: 'Resting Place', color: '#6366f1' },
    ];

    return (
        <div className="map-legend">
            <div className="map-legend-header" onClick={() => setCollapsed(!collapsed)}>
                <i className="ph ph-map-trifold"></i>
                <span>MAP LEGEND</span>
                <button className="panel-toggle-btn" title="Toggle">
                    <i className={`ph ${collapsed ? 'ph-plus' : 'ph-minus'}`}></i>
                </button>
            </div>
            {!collapsed && (
                <div className="map-legend-items">
                    {items.map((item, i) => (
                        <div key={i} className="map-legend-item">
                            <span className="legend-emoji">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
