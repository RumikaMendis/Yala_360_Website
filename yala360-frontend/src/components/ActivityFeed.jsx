import React, { useState, useEffect } from 'react';
import './ActivityFeed.css';

// Event type configurations
// Event type configurations (Favors CSS but keeps primary color for dynamic borders)
const eventConfig = {
    sighting: { color: '#ef4444', icon: 'ph-paw-print' }, // Red for sightings
    entry: { color: '#3b82f6', icon: 'ph-jeep' },
    alert: { color: '#22c55e', icon: 'ph-check-circle' },
    emergency: { color: '#8b5cf6', icon: 'ph-siren' },
    weather: { color: '#3b82f6', icon: 'ph-sun' },
    roadblock: { color: '#ef4444', icon: 'ph-warning' }
};

const upcomingEvents = [];

export default function ActivityFeed({ collapsed, onToggle, sightings = [] }) {
    const [feed, setFeed] = useState([]);

    // Sync state with sightings prop
    useEffect(() => {
        const updateFeed = () => {
            const now = Date.now();
            const liveFeed = sightings.filter(s => {
                // If it has a delay, check if it's passed
                if (s.delayUntil && s.delayUntil > now) return false;
                return true;
            }).map(s => {
                // Robust date handling
                const timestamp = s.time || Date.now();
                const timeStr = new Date(timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: false 
                });

                return {
                    id: s.id,
                    text: `${s.animal ? s.animal.charAt(0).toUpperCase() + s.animal.slice(1) : 'Animal'} spotted in ${s.block || 'Park'}`,
                    time: timeStr,
                    type: 'sighting',
                    timestamp: timestamp
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp) 
            .slice(0, 8);

            setFeed(liveFeed);
        };

        updateFeed();
        
        // Add a tick to refresh the feed if sightings pass their delay
        const tick = setInterval(updateFeed, 10000); // Check every 10s
        return () => clearInterval(tick);

    }, [sightings]);

    // Simulate live updates
    useEffect(() => {
        if (upcomingEvents.length === 0) return;
        let eventIndex = 0;
        const interval = setInterval(() => {
            const newEvent = upcomingEvents[eventIndex % upcomingEvents.length];
            const timeStr = new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            });

            setFeed(prevFeed => {
                const updatedFeed = [{ 
                    id: Date.now(), 
                    text: newEvent.text, 
                    time: timeStr,
                    type: newEvent.type 
                }, ...prevFeed];
                if (updatedFeed.length > 8) updatedFeed.pop();
                return updatedFeed;
            });
            eventIndex++;
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    // Calculate stats
    const newToday = feed.length;
    const resolved = feed.filter(f => f.type === 'alert').length;
    const activeAlerts = feed.filter(f => f.type === 'emergency' || f.type === 'roadblock').length;

    const getEventIcon = (type) => {
        const icons = {
            sighting: '🐆',
            entry: '🚙',
            alert: '⚠️',
            emergency: '🚨',
            weather: '🌤️',
            roadblock: '🚧'
        };
        return icons[type] || '📍';
    };

    return (
        <div className="activity-feed-card">
            {/* Header */}
            <div className="feed-header">
                <div className="feed-header-icon">
                    <i className="ph ph-list-bullets"></i>
                </div>
                <div className="feed-header-text">
                    <h3>Activity Feed</h3>
                    <span>Real-time park updates</span>
                </div>
                <button className="feed-toggle-btn" onClick={onToggle}>
                    <i className={`ph ${collapsed ? 'ph-plus' : 'ph-minus'}`}></i>
                </button>
            </div>

            {!collapsed && (
                <>
                    {/* Feed List */}
                    <div className="feed-list-container">
                        {feed.map((item) => {
                            const config = eventConfig[item.type] || eventConfig.sighting;
                            return (
                                <div key={item.id} className="feed-item" style={{ borderLeftColor: config.color }}>
                                    {/* Icon */}
                                    <div className="feed-icon-wrap" style={{ borderColor: config.color }}>
                                        <span className="feed-emoji">{getEventIcon(item.type)}</span>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="feed-content">
                                        <p className="feed-text">{item.text}</p>
                                        <span className="feed-time">{item.time}</span>
                                    </div>
                                    
                                    {/* Type Badge - Uses config color as fallback/dynamic value */}
                                    <span className="feed-badge" style={{ 
                                        color: 'white', 
                                        background: config.color 
                                    }}>
                                        {item.type}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats Footer */}
                    <div className="feed-stats">
                        <div className="feed-stat">
                            <span className="stat-number" style={{ color: '#d97706' }}>{newToday}</span>
                            <span className="stat-label">New today</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="feed-stat">
                            <span className="stat-number" style={{ color: '#22c55e' }}>{resolved}</span>
                            <span className="stat-label">Resolved</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="feed-stat">
                            <span className="stat-number" style={{ color: '#8b5cf6' }}>{activeAlerts}</span>
                            <span className="stat-label">Active alerts</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
