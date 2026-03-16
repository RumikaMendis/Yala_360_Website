import React, { useState } from 'react';

export default function ActionFAB({ onOpenModal }) {
    const [expanded, setExpanded] = useState(false);

    const toggleFab = () => setExpanded(!expanded);

    return (
        <div className={`fab-container ${expanded ? 'touch-active' : ''}`}>
            {/* Main Toggle Button */}
            <button className="fab" onClick={toggleFab}>
                <i className={expanded ? "ph ph-x" : "ph ph-plus"}></i>
            </button>

            {/* Sub-Actions */}
            <button
                className="fab-mini sighting"
                title="Report Animal Sighting"
                onClick={() => { setExpanded(false); onOpenModal('sighting'); }}
            >
                <i className="ph ph-paw-print"></i>
            </button>
            <button
                className="fab-mini roadblock"
                title="Report Road Block"
                onClick={() => { setExpanded(false); onOpenModal('roadblock'); }}
            >
                <i className="ph ph-traffic-cone"></i>
            </button>
            <button
                className="fab-mini emergency"
                title="Report Emergency"
                onClick={() => { setExpanded(false); onOpenModal('emergency'); }}
            >
                <i className="ph ph-shield-warning"></i>
            </button>
            <button
                className="fab-mini history"
                title="Sighting History"
                onClick={() => {
                    setExpanded(false);
                    document.getElementById('sighting-history')?.scrollIntoView({ behavior: 'smooth' });
                }}
            >
                <i className="ph ph-clock-counter-clockwise"></i>
            </button>

        </div>
    );
}
