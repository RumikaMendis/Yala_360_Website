import React, { useState } from 'react';

export default function MapFilters({ activeFilters, toggleFilter, hideUI, setHideUI }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const filters = [
        { id: 'jeeps', label: 'LIVE JEEPS', icon: 'ph-car' },
        { id: 'sightings', label: 'RECENT SIGHTINGS', icon: 'ph-binoculars' },
        { id: 'hotels', label: 'HOTELS & DINING', icon: 'ph-fork-knife' },
        { id: 'entrances', label: 'ENTRANCES', icon: 'ph-signpost' },
        { id: 'attractions', label: 'ATTRACTIONS', icon: 'ph-camera' },
        { id: 'resting', label: 'RESTING PLACES', icon: 'ph-coffee' },
        { id: 'heatmap', label: 'HEATMAP', icon: 'ph-flame' },
        { id: 'ranger-mode', label: 'RANGER VIEW', icon: 'ph-shield' }
    ];

    return (
        <>
            <div className="filter-controls-header">
                <button
                    className={`filter-toggle ${!isCollapsed ? 'active' : ''}`}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title="Toggle Map Filters"
                >
                    <i className={`ph ${isCollapsed ? 'ph-funnel' : 'ph-x'}`}></i>
                </button>

                <button
                    className={`ui-toggle ${hideUI ? 'active' : ''}`}
                    onClick={() => setHideUI(!hideUI)}
                    title={hideUI ? "Show UI" : "Hide UI Overlays"}
                >
                    <i className={`ph ${hideUI ? 'ph-eye-slash' : 'ph-eye'}`}></i>
                </button>
            </div>

            <div className={`map-controls ${isCollapsed ? 'collapsed' : ''}`}>
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        className={`map-btn ${activeFilters.includes(filter.id) ? 'active' : ''}`}
                        onClick={() => toggleFilter(filter.id)}
                    >
                        <i className={`ph ${filter.icon}`} style={{ marginRight: '8px' }}></i>
                        {filter.label}
                    </button>
                ))}
            </div>
        </>
    );
}
