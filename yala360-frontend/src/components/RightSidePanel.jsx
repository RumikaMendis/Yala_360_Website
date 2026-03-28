import React, { useState, useEffect } from 'react';
import './RightSidePanel.css';

export default function RightSidePanel() {
    const [time, setTime] = useState('--:--:--');
    const [collapsed, setCollapsed] = useState({
        telemetry: false,
    });

    const toggle = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

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
                                <label>HUMIDITY</label>
                                <span className="metric-value humidity">68%</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
