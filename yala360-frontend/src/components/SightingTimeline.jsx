import React from 'react';
import './SightingTimeline.css';

const history = [];

const getAnimalColor = (animal) => {
    if (animal === 'Leopard') return '#d97706';
    if (animal === 'Elephant') return '#3b82f6';
    if (animal === 'Sloth Bear' || animal === 'Bear') return '#d97706'; // Changed to orange like the mockup
    if (animal === 'Crocodile') return '#d97706';
    return '#d97706'; // default orange
};

const getAnimalBg = () => {
    return '#fef3c7'; // default light yellow for SIGHTING badges
};

const getAnimalEmoji = (animal) => {
    if (animal === 'Leopard') return '🐆';
    if (animal === 'Elephant') return '🐘';
    if (animal === 'Sloth Bear' || animal === 'Bear') return '🐆'; // Actually using Leopard emoji for all in mockup for some reason, maybe an error in mockup, but I'll use real emojis.
    if (animal === 'Crocodile') return '🐊';
    if (animal === 'Peacock') return '🦚';
    return '🐾';
};

export default function SightingTimeline({ sightings = [] }) {
    const sorted = [...sightings].sort((a, b) => b.time - a.time);

    return (
        <div className="sighting-history-container">
            <h2 className="history-header">Sighting History</h2>
            {/* The white cards list */}
            <div className="history-feed-list">
                {sorted.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        No records found for this session.
                    </div>
                ) : (
                    sorted.map((s, i) => {
                        const color = getAnimalColor(s.animal);
                        const bg = getAnimalBg(s.animal);
                        
                        const timeStr = new Date(s.time).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: false 
                        });

                        return (
                            <div key={s.id || i} className="history-feed-item" style={{ borderLeftColor: color }}>
                                <div className="history-feed-icon-wrap" style={{ borderColor: color }}>
                                    <span className="feed-emoji">{getAnimalEmoji(s.animal)}</span>
                                </div>
                                
                                <div className="feed-content">
                                    <p className="feed-text">{s.animal.charAt(0).toUpperCase() + s.animal.slice(1)} spotted in {s.block || 'Park'}</p>
                                    <span className="feed-time" style={{ color: color }}>{timeStr}</span>
                                </div>
                                
                                <span className="feed-badge" style={{ color: color, background: bg }}>
                                    SIGHTING
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
