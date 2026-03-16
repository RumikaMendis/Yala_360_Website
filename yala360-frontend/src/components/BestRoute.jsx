import React from 'react';

export default function BestRoute({ blockTraffic }) {
    // Logic to find the blocks with the lowest traffic
    const sortedBlocks = Object.entries(blockTraffic || {})
        .sort(([, a], [, b]) => a - b);

    const bestBlocks = sortedBlocks.length >= 2
        ? [sortedBlocks[0][0], sortedBlocks[1][0]]
        : ["Yala National Park - Block 2", "Yala National Park - Block 1"];

    const routeStr = `${bestBlocks[0].replace('Yala National Park - ', '')} → ${bestBlocks[1].replace('Yala National Park - ', '')}`;

    return (
        <div className="prediction-panel">

            <div className="route-header">
                <i className="ph ph-compass"></i>
                <span>SMART SAFARI ROUTE</span>
            </div>
            <div style={{ padding: '15px 20px', backgroundColor: 'var(--widget-bg)', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
                <div style={{ fontSize: '10px', color: '#a0a0a0', marginBottom: '4px', fontWeight: 700, letterSpacing: '1px' }}>RECOMMENDED ROUTE</div>
                <div style={{ fontSize: '18px', color: '#10b981', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ph ph-map-pin" style={{ fontSize: '20px' }}></i>
                    {routeStr}
                </div>

                <div style={{ fontSize: '10px', color: '#a0a0a0', marginBottom: '8px', fontWeight: 700, letterSpacing: '1px' }}>REASON</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="ph ph-trend-up" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
                        High probability of predator sightings based on current time.
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ph ph-jeep" style={{ color: '#10b981', fontSize: '16px' }}></i>
                        Currently experiencing the lowest jeep congestion.
                    </li>
                </ul>
            </div>
        </div>
    );
}
