import React, { useState, useEffect } from 'react';
import ActivityFeed from './ActivityFeed';
import './RightSidePanel.css';

export default function RightSidePanel({ safariCount, blockTraffic = {}, sightings = [] }) {
    const [time, setTime] = useState('--:--:--');
    const [selectedBlock, setSelectedBlock] = useState('Block 1');
    const [collapsed, setCollapsed] = useState({
        telemetry: false,
        congestion: false,
        feed: false,
    });

    const toggle = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Block data with max capacities
    const blocks = [
        { name: "Block 1", max: 20 },
        { name: "Block 2", max: 20 },
        { name: "Block 3", max: 15 },
        { name: "Block 4", max: 15 },
        { name: "Block 5", max: 15 },
        { name: "Strict Nature Reserve", max: 5 },
    ];

    // Get current block data
    const currentBlock = blocks.find(b => b.name === selectedBlock) || blocks[0];
    const count = blockTraffic[selectedBlock] || 0;
    const percentage = Math.min(100, Math.round((count / currentBlock.max) * 100));

    // Determine status
    let color, status, detail;
    if (count >= 10) {
        color = '#ef4444';
        status = 'Heavy';
        detail = 'Congested';
    } else if (count >= 5) {
        color = '#f59e0b';
        status = 'Moderate';
        detail = 'Peak hours';
    } else {
        color = '#22c55e';
        status = 'Clear';
        detail = 'Smooth';
    }

    return (
        <aside className="right-side-panel">

            {/* === CARD 1: TELEMETRY === */}
            <div className="telemetry-card">
                <div className="card-header">
                    <div className="header-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                        <i className="ph ph-broadcast"></i>
                    </div>

                    <div className="header-text">
                        <h3>Live Telemetry</h3>
                        <span>Real-time park conditions</span>
                    </div>
                    <button className="toggle-btn" onClick={() => toggle('telemetry')}>
                        <i className={`ph ${collapsed.telemetry ? 'ph-plus' : 'ph-minus'}`}></i>
                    </button>
                </div>

                {!collapsed.telemetry && (
                    <div className="telemetry-content">
                        <div className="metrics-grid">
                            <div className="metric">
                                <label>LOCAL TIME</label>
                                <span className="metric-value time">{time}</span>
                            </div>
                            <div className="metric">
                                <label>TEMPERATURE</label>
                                <span className="metric-value temp">32°C <small>/ 89°F</small></span>
                            </div>
                            <div className="metric">
                                <label>WIND</label>
                                <span className="metric-value wind">12 km/h SE</span>
                            </div>
                            <div className="metric">
                                <label>ACTIVE SAFARIS</label>
                                <span className="metric-value safaris">{safariCount} <small>vehicles</small></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* === CARD 2: PARK CONGESTION (SELECTED BLOCK GAUGE) === */}
            <div className="congestion-card">
                <div className="card-header">
                    <div className="header-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>
                        <i className="ph ph-traffic-cone"></i>
                    </div>
                    <div className="header-text">
                        <h3>Park Congestion Monitor</h3>
                        <span>Select a block to view capacity</span>
                    </div>
                    <button className="toggle-btn" onClick={() => toggle('congestion')}>
                        <i className={`ph ${collapsed.congestion ? 'ph-plus' : 'ph-minus'}`}></i>
                    </button>
                </div>

                {!collapsed.congestion && (
                    <div className="congestion-content">

                        {/* BIG GAUGE - Shows selected block only */}
                        <div className="selected-block-display">
                            <div className="big-gauge">
                                <svg viewBox="0 0 200 120" className="gauge-svg">
                                    {/* Background arc */}
                                    <path
                                        d="M 20 100 A 80 80 0 0 1 180 100"
                                        fill="none"
                                        stroke="#e2e8f0"
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                    />
                                    {/* Fill arc */}
                                    <path
                                        d="M 20 100 A 80 80 0 0 1 180 100"
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeDasharray={251}
                                        strokeDashoffset={251 - (percentage / 100) * 251}
                                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                    />
                                </svg>
                                <div className="gauge-center">
                                    <span className="gauge-percent" style={{ color }}>{percentage}%</span>
                                    <span className="gauge-status" style={{ color }}>{status}</span>
                                </div>

                            </div>

                            <div className="selected-block-info">
                                <h4>{selectedBlock}</h4>
                                <div className="block-count">
                                    <span style={{ color, fontSize: '28px', fontWeight: '800' }}>{count}</span>
                                    <span style={{ color: '#94a3b8', fontSize: '16px' }}> / {currentBlock.max} vehicles</span>
                                </div>
                                <p className="block-detail">{detail}</p>
                            </div>
                        </div>

                        {/* Block Selector Buttons */}
                        <div className="block-selector">
                            <span className="selector-label">Select Block:</span>
                            <div className="block-buttons">
                                {blocks.map(block => {
                                    const blockCount = blockTraffic[block.name] || 0;
                                    let blockColor = '#22c55e';
                                    if (blockCount >= 10) blockColor = '#ef4444';
                                    else if (blockCount >= 5) blockColor = '#f59e0b';

                                    return (
                                        <button
                                            key={block.name}
                                            className={`block-btn ${selectedBlock === block.name ? 'active' : ''}`}
                                            style={{
                                                borderColor: blockColor,
                                                background: selectedBlock === block.name ? blockColor : 'white',
                                                color: selectedBlock === block.name ? 'white' : blockColor
                                            }}
                                            onClick={() => setSelectedBlock(block.name)}
                                        >
                                            {block.name === "Strict Nature Reserve" ? "SNR" : block.name.replace('Block ', '')}
                                            <span className="block-btn-count" style={{
                                                background: selectedBlock === block.name ? 'rgba(255,255,255,0.3)' : blockColor + '20',
                                                color: selectedBlock === block.name ? 'white' : blockColor
                                            }}>
                                                {blockCount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                )}
            </div>


            {/* Quick Stats */}
            <div className="quick-stats">
                <div className="stat">
                    <span className="stat-value" style={{ color: '#22c55e' }}>12 km</span>
                    <span className="stat-label">VISIBILITY</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat">
                    <span className="stat-value" style={{ color: '#f59e0b' }}>68%</span>
                    <span className="stat-label">HUMIDITY</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat">
                    <span className="stat-value" style={{ color: '#fbbf24' }}>High (8)</span>
                    <span className="stat-label">UV INDEX</span>
                </div>
            </div>

            <ActivityFeed collapsed={collapsed.feed} onToggle={() => toggle('feed')} sightings={sightings} />
        </aside>
    );
}
