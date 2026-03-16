import React, { useState, useEffect } from "react"
import "./RecentSightings.css"
import { officialYalaGeoJSON } from '../data/yala_blocks';
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

export default function RecentSightings({ sightings }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const sorted = [...sightings]
        .sort((a, b) => (b.time || b.reportedAt || 0) - (a.time || a.reportedAt || 0))
        .slice(0, 5);

    const getAnimalColor = (animal) => {
        const a = animal?.toLowerCase() || '';
        if (a.includes('leopard')) return '#ef4444'; // Red for sightings
        if (a.includes('elephant')) return '#ef4444';
        if (a.includes('bear')) return '#ef4444';
        if (a.includes('croc')) return '#10b981';
        return '#ef4444';
    };

    const getAnimalEmoji = (animal) => {
        const a = animal?.toLowerCase() || '';
        if (a.includes('leopard')) return '🐆';
        if (a.includes('elephant')) return '🐘';
        if (a.includes('bear')) return '🐻';
        if (a.includes('croc')) return '🐊';
        if (a.includes('peacock')) return '🦚';
        return '🐾';
    };

    const getBlockName = (lat, lng) => {
        if (!lat || !lng) return "Unknown Block";
        
        // Check actual GeoJSON polygons
        const pt = point([lng, lat]); // Turf uses [lng, lat]
        const block = officialYalaGeoJSON.features.find(f => 
            booleanPointInPolygon(pt, f)
        );
        
        return block ? block.properties.name : "Near Park";
    };

    const getSightingTitle = (animal, id) => {
        const titles = {
            "Leopard": ["Leopard spotted near waterhole", "Female leopard resting on branch", "Leopard roaming in scrub"],
            "Elephant": ["Elephant herd crossing road", "Lone tusker near Palatupana", "Elephant feeding near water"],
            "Sloth Bear": ["Sloth Bear with cubs", "Sloth Bear foraging at dusk", "Bear spotted near rocks"],
            "Crocodile": ["Crocodile basking on riverbank", "Large croc near Menik Ganga"]
        };
        const animalKey = animal?.includes('Bear') ? 'Sloth Bear' : animal;
        const options = titles[animalKey] || [`${animal} spotted`];
        const num = String(id || now).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return options[num % options.length];
    };

    const formatTime = (time) => {
        if (!time) return "--:--";
        const date = new Date(time);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className="recent-sightings-wrapper activity-feed-card">
            {/* Header */}
            <div className="feed-header">
                <div className="feed-header-icon">
                    <i className="ph ph-clock-counter-clockwise"></i>
                </div>
                <div className="feed-header-text">
                    <h3>Sighting History</h3>
                    <span>Confirmed public locations</span>
                </div>
            </div>

            <div className="feed-list-container">
                {sorted.length === 0 ? (
                    <div className="no-data">
                        No recent sightings found.
                    </div>
                ) : (
                    sorted.map((s, i) => {
                        const color = getAnimalColor(s.animal);
                        const block = getBlockName(s.publicLocation?.lat || s.lat, s.publicLocation?.lng || s.lng);
                        const title = getSightingTitle(s.animal, s.id || i);
                        
                        return (
                            <div key={i} className="feed-item" style={{ borderLeftColor: color }}>
                                <div className="feed-icon-wrap" style={{ borderColor: color, width: '40px', height: '40px' }}>
                                    <span className="feed-emoji" style={{ fontSize: '24px' }}>{getAnimalEmoji(s.animal)}</span>
                                </div>
                                
                                <div className="feed-content">
                                    <p className="feed-text">
                                        {title} in {block}
                                    </p>
                                    <span className="feed-time" style={{ color: color, fontWeight: '700', fontSize: '11px', marginTop: '4px' }}>
                                        {formatTime(s.time)}
                                    </span>
                                </div>
                                
                                <span className="feed-badge" style={{ color: 'white', background: color, padding: '4px 12px', fontSize: '10px', fontWeight: '800' }}>
                                    SIGHTING
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    )
}
