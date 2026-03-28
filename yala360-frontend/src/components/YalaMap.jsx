import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
window.L = L; // Important for leaflet.heat to attach itself globally
import { officialYalaGeoJSON } from '../data/yala_blocks';
import { ref, push } from "firebase/database";
import { db } from "../firebase";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

// CRITICAL: Leaflet will look broken without its core CSS
import 'leaflet/dist/leaflet.css';


// Custom Zoom Control Component
function CustomZoomControl() {
    const map = useMap();

    const INITIAL_LAT = 6.3670;
    const INITIAL_LNG = 81.5173;
    const INITIAL_ZOOM = 11;

    const handleHome = (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.flyTo([INITIAL_LAT, INITIAL_LNG], INITIAL_ZOOM, {
            duration: 1.2
        });
    };

    const handleZoomIn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.zoomIn();
    };

    const handleZoomOut = (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.zoomOut();
    };

    return (
        <div
            className="custom-zoom-control leaflet-bottom leaflet-left"
            style={{
                bottom: "20px",
                left: "20px",
                position: "absolute",
                zIndex: 1000
            }}
        >
            <button type="button" className="zoom-btn home-btn" title="Reset View" onClick={handleHome}>
                <i className="ph ph-house"></i>
            </button>

            <button type="button" className="zoom-btn" title="Zoom In" onClick={handleZoomIn}>
                <i className="ph ph-plus"></i>
            </button>

            <button type="button" className="zoom-btn" title="Zoom Out" onClick={handleZoomOut}>
                <i className="ph ph-minus"></i>
            </button>
        </div>
    );
}



// Helper to create your custom Phosphor icon pins
const createPremiumPin = (iconClass, colorClass) => {
    return L.divIcon({
        className: 'pin-wrapper',
        html: `<div class="pin-marker ${colorClass}"><i class="ph ${iconClass}"></i></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};


// Stunning Custom Teardrop Sighting Pin (Paw Print)
const wildlifeIcon = createPremiumPin("ph-paw-print", "pin-sighting");

// Animal Specific Icons
const leopardIcon = createPremiumPin("ph-paw-print", "pin-leopard");
const elephantIcon = createPremiumPin("ph-elephant", "pin-elephant");
const bearIcon = createPremiumPin("ph-paw-print", "pin-bear");

/**
 * chooses the correct icon automatically.
 */
function getAnimalIcon(animal) {
    if (!animal) return wildlifeIcon;
    const a = animal.toLowerCase();
    if (a.includes("leopard")) return leopardIcon;
    if (a.includes("elephant")) return elephantIcon;
    if (a.includes("bear")) return bearIcon;
    return wildlifeIcon;
}

// Static locations for all Premium Pins categorized by map filter IDs
const locations = [
    { lat: 6.3350, lng: 81.4980, title: "Patanangala Resting Area", desc: "Safe zone to stretch legs near the beach.", type: "resting", icon: "ph-coffee", colorClass: "pin-resting" },
    { lat: 6.3820, lng: 81.5210, title: "Menik Ganga Resting Area", desc: "Rest stop by the river.", type: "resting", icon: "ph-coffee", colorClass: "pin-resting" },

    { lat: 6.3967, lng: 81.3833, title: "Sithulpawwa Rock Temple", desc: "Ancient 2nd-century BC monastery on rock outcrop. 400 steps climb with panoramic jungle views.", type: "attractions", icon: "ph-camera", colorClass: "pin-attraction", image: "/images/attractions/sithulpawwa.png" },
    { lat: 6.2128, lng: 81.3361, title: "Kirinda Beach & Temple", desc: "Coastal Hindu temple and beach south of Palatupana. Historic landing site and whale watching point.", type: "attractions", icon: "ph-camera", colorClass: "pin-attraction", image: "/images/attractions/kirinda.png" },
    { lat: 6.4139, lng: 81.3347, title: "Kataragama Sacred City", desc: "Holy pilgrimage site with ancient Hindu temples. Access via Katagamuwa entrance.", type: "attractions", icon: "ph-camera", colorClass: "pin-attraction", image: "/images/attractions/kataragama.png" },
    { lat: 6.4333, lng: 81.2667, title: "Sella Kataragama", desc: "Quiet temple complex at Galge entrance gateway. Sacred bathing spots.", type: "attractions", icon: "ph-camera", colorClass: "pin-attraction", image: "/images/attractions/sella.png" }
];

const mockEntrances = [
    {
        lat: 6.258333,
        lng: 81.358333,
        name: "Palatupana Entrance",
        desc: "Primary Main Entrance near Kirinda. Best for Block I.",
        img: "/images/palatupana_gate_1771811459470.png",
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=6.258333,81.358333"
    },
    {
        lat: 6.383333,
        lng: 81.283333,
        name: "Katagamuwa Entrance",
        desc: "Northern access from Kataragama to Blocks I & II.",
        img: "/images/katagamuwa_gate_1771811483777.png",
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=6.383333,81.283333"
    },
    {
        lat: 6.433333,
        lng: 81.266667,
        name: "Galge Entrance",
        desc: "Western side on Buttala–Kataragama road. Accesses Blocks III & V.",
        img: "/images/galge_gate_1771811529330.png",
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=6.433333,81.266667"
    }
];


const entranceIcon = createPremiumPin("ph-signpost", "pin-entrance");

const hotelsAndRestaurants = [
    // HOTELS - All OUTSIDE park boundaries (Fixed coordinates)
    {
        id: 'jetwing-yala',
        name: "Jetwing Yala",
        type: "hotel",
        lat: 6.2581,      // FIXED: Real location at Palatupana entrance
        lng: 81.3580,     // FIXED: West of Block 1 boundary
        desc: "Luxury beachfront resort at Palatupana. 38 acres of coastal wilderness bordering Yala. Direct beach access on Bay of Bengal.",
        address: "Palatupana, Kirinda, Sri Lanka",
        website: "https://www.jetwinghotels.com/jetwingyala/",
        // REAL Google Maps directions link using name to avoid snapping
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=Jetwing+Yala+Palatupana",
        phone: "+94 47 471 0710",
        rating: "4.8 ★",
        price: "$$$$",
        image: "https://www.jetwinghotels.com/jetwingyala/wp-content/uploads/sites/32/2017/11/gallery-desktop-large.jpg"
    },
    {
        id: 'cinnamon-wild',
        name: "Cinnamon Wild Yala",
        type: "hotel",
        lat: 6.2596,      // FIXED: Moved west to 81.36 to clear park boundary
        lng: 81.3600,     // FIXED: Was 81.5120 (inside), now outside near entrance
        desc: "Chalet-style rooms with beach/jungle views. 5-minute drive to Yala National Park. Tuskers restaurant & Pugmarks bar.",
        address: "P.O Box 1, Kirinda, Tissamaharama",
        website: "https://www.cinnamonhotels.com/cinnamon-wild-yala",
        // REAL Google Maps link using name
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=Cinnamon+Wild+Yala+Palatupana+Kirinda",
        phone: "+94 47 223 9449",
        rating: "4.6 ★",
        price: "$$$",
        image: "https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1302818674/cms/cache/v2/67f780fbdda17.jpg/1920x1080/resize/80/210abf152ea594e0201a8a2d09f53017.jpg"
    },
    {
        id: 'yala-safari-resort',
        name: "Yala Safari Resort",
        type: "hotel",
        lat: 6.2860,      // CORRECT: Tissamaharama town (west of park)
        lng: 81.3000,
        desc: "Budget-friendly base in Tissamaharama. Safari packages to Yala, Bundala, and Udawalawe available.",
        address: "Gemunupura Road, Debarawewa, Tissamaharama",
        website: "https://www.booking.com/hotel/lk/yala-safari-resort.html",
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=Yala+Safari+Resort+Tissamaharama",
        phone: "+94 47 223 8000",
        rating: "4.0 ★",
        price: "$$",
        image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/39/d6/3a/22-france-clients-two.jpg?w=800&h=400&s=1"
    },
    
    // RESTAURANTS - Real places in Tissamaharama (outside park)
    {
        id: 'tissa-lake-view',
        name: "Tissa Lake View Restaurant",
        type: "restaurant",
        lat: 6.2805,      // Real location on B464
        lng: 81.2850,
        desc: "Scenic dining by Tissa Wewa lake. Fresh seafood and Sri Lankan breakfast. Open 7AM-11AM for breakfast.",
        address: "60 B464, Tissamaharama 82600",
        website: "https://www.facebook.com/tissalakeviewrestaurant", // Likely FB page
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=Tissa+Lake+View+Restaurant+Tissamaharama",
        phone: "+94 77 987 6543",
        rating: "4.4 ★",
        price: "$$",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 'flavors-restaurant',
        name: "The Flavors Restaurant",
        type: "restaurant",
        lat: 6.2830,      // Tissa town center
        lng: 81.2880,
        desc: "Family-run authentic Sri Lankan cuisine. Popular with safari guides for fresh rice and curry.",
        address: "Main Road, Tissamaharama",
        website: "https://www.facebook.com/theflavorsrestauranttissa",
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=The+Flavors+Restaurant+Tissamaharama",
        phone: "+94 77 123 4567",
        rating: "4.5 ★",
        price: "$$",
        image: "https://images.unsplash.com/photo-1606851094655-b2593a9af63f?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 'hathmaluwa',
        name: "Hathmaluwa Restaurant",
        type: "restaurant",
        lat: 6.2780,      // Tissa area
        lng: 81.2920,
        desc: "Hidden gem serving traditional southern Sri Lankan dishes. Famous for authentic village-style cooking.",
        address: "Debarawewa Road, Tissamaharama",
        website: "https://www.facebook.com/hathmaluwarestaurant",
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=Hathmaluwa+Restaurant+Tissamaharama",
        phone: "+94 77 456 7890",
        rating: "4.6 ★",
        price: "$",
        image: "https://images.unsplash.com/photo-1626202157577-4e97f94ce21f?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 'smoky-kitchen',
        name: "Smoky Kitchen",
        type: "restaurant",
        lat: 6.2810,
        lng: 81.2900,
        desc: "Open clay kitchen, best rice & curry in town",
        address: "Tissamaharama",
        website: "https://www.facebook.com/smoky.kitchen.tissa/",
        googleMaps: "https://www.google.com/maps/dir/?api=1&destination=Smoky+Kitchen+Tissamaharama",
        phone: "+94 77 987 6543",
        rating: "4.5 ★",
        price: "$$",
        image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/29/77/b0/dd/caption.jpg?w=1200&h=-1&s=1"
    }
];



// Custom icons for hotels and restaurants
const hotelIcon = L.divIcon({
    className: 'hotel-marker',
    html: `<div style="
        width: 36px; height: 36px;
        background: #8b5cf6;
        border: 3px solid #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
    "><i class="ph-fill ph-bed" style="font-size: 16px; color: #fff;"></i></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
});

const restaurantIcon = L.divIcon({
    className: 'restaurant-marker',
    html: `<div style="
        width: 36px; height: 36px;
        background: #a5f3fc;
        border: 3px solid #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(165, 243, 252, 0.4);
    "><i class="ph ph-fill ph-fork-knife" style="font-size: 16px; color: #0891b2;"></i></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
});



export default function YalaMap({ isDarkMode, jeeps, sightings = [], activeFilters, blockTraffic, leopardHotspots = [] }) {
    const [selectedZone, setSelectedZone] = useState(null);
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);


    const INITIAL_LAT = 6.3670;
    const INITIAL_LNG = 81.5173;
    const INITIAL_ZOOM = 11;

    // Your static heat points from script.js
    // const heatPoints = [
    //     [6.36, 81.40, 0.8], [6.37, 81.41, 0.9], [6.365, 81.405, 0.7],
    //     [6.45, 81.55, 0.9], [6.46, 81.54, 0.8], [6.455, 81.545, 1.0],
    //     [6.33, 81.38, 0.6], [6.32, 81.37, 0.7], [6.325, 81.375, 0.5]
    // ];

    const zoneStyle = (feature) => {
        const count = blockTraffic[feature.properties.name] || 0;
        const isHotspot = leopardHotspots.includes(feature.properties.name);
        
        // Base colors for each block (subtle tints)
        const blockColors = {
            "Block 1": "#fef3c7", // Warm yellow
            "Block 2": "#dbeafe", // Cool blue  
            "Block 3": "#dcfce7", // Fresh green
            "Block 4": "#f3e8ff", // Soft purple
            "Block 5": "#ffedd5", // Peach orange
            "Strict Nature Reserve": "#fee2e2" // Red tint
        };
        
        const fillColor = blockColors[feature.properties.name] || "#f1f5f9";
        
        // Traffic density overlay (subtle)
        let trafficOpacity = 0;
        if (count >= 10) trafficOpacity = 0.1;
        else if (count >= 5) trafficOpacity = 0.05;
        
        return {
            fillColor: fillColor,
            fillOpacity: 0.75 + trafficOpacity,
            // KEY FIX: Bold grey border to cover gaps
            color: "#9ca3af", // Grey edge
            weight: 4, // Bold line to cover gaps
            opacity: 1, // Solid edge
            dashArray: null,
            lineCap: 'round',
            lineJoin: 'round',
            className: isHotspot ? 'leopard-hotspot-block' : ''
        };
    };

    const onEachZone = (feature, layer) => {
        const blockName = feature.properties.name;
        const colors = {
            "Block 1": { fill: "#fef3c7", hover: "#fde68a" },
            "Block 2": { fill: "#dbeafe", hover: "#bfdbfe" },
            "Block 3": { fill: "#dcfce7", hover: "#bbf7d0" },
            "Block 4": { fill: "#f3e8ff", hover: "#e9d5ff" },
            "Block 5": { fill: "#ffedd5", hover: "#fed7aa" },
            "Strict Nature Reserve": { fill: "#fee2e2", hover: "#fecaca" }
        };
        
        const blockColors = colors[blockName] || { fill: "#f1f5f9", hover: "#e2e8f0" };
        
        // Status for tooltip
        let status = (feature.properties.status || "Open").toUpperCase();
        let dotColor = "#22c55e";
        let statusStr = "Open";
        if (status === "CLOSED") {
            dotColor = "#ef4444";
            statusStr = "CLOSED";
        } else if (status === "CAUTION") {
            dotColor = "#f59e0b";
            statusStr = "Caution";
        }

        // Modern tooltip
        layer.bindTooltip(
            `<div style="font-family:Outfit,sans-serif;padding:8px 12px;background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:4px;">${blockName}</div>
                <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b;">
                    <span style="width:8px;height:8px;background:${dotColor};border-radius:50%;"></span>
                    <span>${statusStr}</span>
                </div>
             </div>`,
            { 
                sticky: true, 
                direction: "top",
                className: "modern-tooltip",
                offset: [0, -10]
            }
        );

        // Smooth hover effects
        layer.on({
            mouseover: (e) => {
                const l = e.target;
                l.setStyle({ 
                    fillOpacity: 0.9,
                    weight: 5,
                    color: "#6b7280" // Darker grey on hover
                });
                l.bringToFront();
            },
            mouseout: (e) => {
                const l = e.target;
                const count = blockTraffic[blockName] || 0;
                let trafficOpacity = 0;
                if (count >= 10) trafficOpacity = 0.1;
                else if (count >= 5) trafficOpacity = 0.05;
                
                l.setStyle({ 
                    fillOpacity: 0.75 + trafficOpacity,
                    weight: 4, // Keep bold grey border
                    color: "#9ca3af"
                });
            },
            click: (e) => {
                // Pulse effect on click
                let clickedLayer = e.target;
                clickedLayer.setStyle({ 
                    fillOpacity: 0.9,
                    weight: 5
                });
                setTimeout(() => {
                    const count = blockTraffic[blockName] || 0;
                    let trafficOpacity = 0;
                    if (count >= 10) trafficOpacity = 0.1;
                    else if (count >= 5) trafficOpacity = 0.05;
                    
                    clickedLayer.setStyle({ 
                        fillOpacity: 0.75 + trafficOpacity,
                        weight: 4,
                        color: "#9ca3af"
                    });
                }, 300);
                
                setSelectedZone(feature.properties);
            }
        });
    };

    return (
        <MapContainer
            center={[INITIAL_LAT, INITIAL_LNG]}
            zoom={INITIAL_ZOOM}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
            zoomControl={false}
            scrollWheelZoom={true}
            preferCanvas={true}
            minZoom={8}
            maxZoom={16}
            doubleClickZoom={true}
        >
            <CustomZoomControl />

            <TileLayer
                url={isDarkMode
                    ? "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
                attribution='&copy; OpenStreetMap contributors'
            />



            {/* Renders your 7 park blocks with click events */}
            <GeoJSON data={officialYalaGeoJSON} style={zoneStyle} onEachFeature={onEachZone} />

            {/* Renders Custom Premium Pins dynamically based on active filters */}
            {locations.filter(loc => activeFilters.includes(loc.type)).map((loc) => (
                <Marker
                    key={loc.title}
                    position={[loc.lat, loc.lng]}
                    icon={createPremiumPin(loc.icon, loc.colorClass)}
                >
                    <Popup className="hotel-popup" maxWidth={loc.image ? 280 : 250} minWidth={loc.image ? 250 : 200}>
                        <div style={{
                            fontFamily: 'Outfit, sans-serif',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            minWidth: loc.image ? '250px' : 'auto',
                            width: '100%'
                        }}>
                            {loc.image && (
                                <img src={loc.image} alt={loc.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                            )}
                            <div style={{ padding: loc.image ? '16px' : '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <span style={{ 
                                        fontSize: '10px', 
                                        fontWeight: '700', 
                                        color: loc.type === 'attractions' ? '#059669' : '#4f46e5', 
                                        background: loc.type === 'attractions' ? '#d1fae5' : '#e0e7ff', 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {loc.type === 'attractions' ? 'Attraction' : 'Location'}
                                    </span>
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{loc.title}</h3>
                                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{loc.desc}</p>
                                <a 
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        padding: '10px', background: loc.type === 'attractions' ? '#10b981' : '#6366f1',
                                        color: 'white', borderRadius: '8px', textDecoration: 'none',
                                        fontSize: '13px', fontWeight: '600', transition: 'all 0.2s'
                                    }}
                                >
                                    <i className="ph ph-map-trifold"></i>
                                    Get Directions
                                </a>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Entrances with Modern Popups */}
            {activeFilters.includes('entrances') && mockEntrances.map(e => (
                <Marker key={e.name} position={[e.lat, e.lng]} icon={entranceIcon}>
                    <Popup className="hotel-popup" maxWidth={300}>
                        <div style={{
                            fontFamily: 'Outfit, sans-serif',
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}>
                            <img src={e.img} alt={e.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                            <div style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <span style={{ 
                                        fontSize: '10px', 
                                        fontWeight: '700', 
                                        color: '#6366f1', 
                                        background: '#eef2ff', 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Park Entrance
                                    </span>
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{e.name}</h3>
                                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{e.desc}</p>
                                <a 
                                    href={e.googleMaps} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '12px',
                                        background: '#6366f1',
                                        color: 'white',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                                >
                                    <i className="ph ph-map-trifold"></i>
                                    Get Directions
                                </a>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}


            {/* Real-time Firebase Sightings */}
            {activeFilters.includes('sightings') && sightings.map((sighting, index) => {
                // Skip if no valid coordinates yet
                if (!sighting.lat && !sighting.publicLocation && !sighting.exactLocation) return null;
                
                const isRangerMode = activeFilters.includes('ranger-mode');
                const isDelayed = !isRangerMode && sighting.delayUntil && now < sighting.delayUntil;
                
                // FIX: Don't show delayed sightings to public users at all (avoid wrong location jump)
                if (isDelayed) return null;
                
                // [FIX] Robust filter to hide legacy ghost markers in Block 3 center
                const isGhostCoord = (val, target) => Math.abs(Number(val) - target) < 0.005;
                const isGhost = (isGhostCoord(sighting.lat, 6.325) && isGhostCoord(sighting.lng, 81.480)) ||
                                (sighting.exactLocation && isGhostCoord(sighting.exactLocation.lat, 6.325) && isGhostCoord(sighting.exactLocation.lng, 81.480)) ||
                                (sighting.publicLocation && isGhostCoord(sighting.publicLocation.lat, 6.33) && isGhostCoord(sighting.publicLocation.lng, 81.48));
                
                if (isGhost) return null;
                
                // Safe coordinate extraction with proper fallbacks
                let displayLat, displayLng;
                
                if (isRangerMode && sighting.exactLocation) {
                    // Rangers see exact location
                    displayLat = sighting.exactLocation.lat;
                    displayLng = sighting.exactLocation.lng;
                } else if (isDelayed && sighting.publicLocation) {
                    // Public sees rounded location during delay
                    displayLat = sighting.publicLocation.lat;
                    displayLng = sighting.publicLocation.lng;
                } else if (sighting.lat && sighting.lng) {
                    // Fallback to root coordinates
                    displayLat = sighting.lat;
                    displayLng = sighting.lng;
                } else {
                    // Skip if no coordinates available
                    return null;
                }

                return (
                    <React.Fragment key={`sighting-group-${sighting.id || index}`}>
                        {/* Accuracy Radius for Ranger Mode */}
                        {isRangerMode && sighting.exactLocation && (
                            <Circle 
                                center={[displayLat, displayLng]}
                                radius={40}
                                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }}
                            />
                        )}

                        <Marker
                            key={`sighting-${sighting.id || index}`}
                            position={[displayLat, displayLng]}
                            icon={getAnimalIcon(sighting.animal)}
                            eventHandlers={{
                                add: (evt) => {
                                    if (sighting.isNew) {
                                        L.DomUtil.addClass(evt.target.getElement(), 'new-sighting');
                                    }
                                    if (isRangerMode) {
                                        L.DomUtil.addClass(evt.target.getElement(), 'ranger-tactical-marker');
                                    }
                                }
                            }}
                        >
                            <Popup className="hotel-popup" maxWidth={isRangerMode ? 280 : 220}>
                                <div style={{ padding: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <span style={{ 
                                            fontSize: '10px', 
                                            fontWeight: '700', 
                                            color: isRangerMode ? '#fff' : '#ef4444', 
                                            background: isRangerMode ? '#dc2626' : '#fef2f2', 
                                            padding: '2px 8px', 
                                            borderRadius: '4px', 
                                            textTransform: 'uppercase' 
                                        }}>
                                            {isRangerMode ? '⚠️ Tactical Intel' : 'Live Sighting'}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: isRangerMode ? '#ef4444' : '#1e293b' }}>
                                        {sighting.animal}
                                    </h3>
                                    
                                    {isRangerMode ? (
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                                            <div style={{color: '#1e293b', fontWeight: '600'}}>RAW TELEMETRY:</div>
                                            <div>LAT: {displayLat.toFixed(6)}</div>
                                            <div>LNG: {displayLng.toFixed(6)}</div>
                                            <div style={{marginTop: '4px'}}>TIMESTAMP: {new Date(sighting.time).toLocaleTimeString()}</div>
                                            
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <button style={{ 
                                                    flex: 1, padding: '8px', background: '#059669', color: '#fff', 
                                                    border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' 
                                                }}>Verify</button>
                                                <button style={{ 
                                                    flex: 1, padding: '8px', background: '#1e293b', color: '#fff', 
                                                    border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' 
                                                }}>Dispatch</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {isDelayed && (
                                                <div style={{color: '#f59e0b', fontSize: '11px', marginBottom: '12px', fontWeight: '600'}}>
                                                    📍 Location approximated
                                                </div>
                                            )}
                                            <a 
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${displayLat},${displayLng}`}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    padding: '8px', background: '#ef4444',
                                                    color: 'white', borderRadius: '6px', textDecoration: 'none',
                                                    fontSize: '12px', fontWeight: '600', transition: 'all 0.2s'
                                                }}
                                            >
                                                <i className="ph ph-map-trifold"></i>
                                                Get Directions
                                            </a>
                                        </>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    </React.Fragment>
                );
            })}
            {/* Hotels & Restaurants */}
            {activeFilters.includes('hotels') && hotelsAndRestaurants.map((place) => (
                <Marker
                    key={place.id}
                    position={[place.lat, place.lng]}
                    icon={place.type === 'hotel' ? hotelIcon : restaurantIcon}
                >
                    <Popup className="hotel-popup" maxWidth={300}>
                        <div style={{
                            fontFamily: 'Outfit, sans-serif',
                            padding: '0',
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}>
                            {/* Image Header */}
                            <div style={{
                                height: '140px',
                                background: place.image 
                                    ? `url(${place.image}) center/cover no-repeat` 
                                    : `linear-gradient(135deg, ${place.type === 'hotel' ? '#8b5cf6' : '#f59e0b'} 0%, ${place.type === 'hotel' ? '#7c3aed' : '#d97706'} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {!place.image && (
                                    <i className={`ph ${place.type === 'hotel' ? 'ph-bed' : 'ph-utensils'}`} 
                                       style={{fontSize: '48px', color: 'rgba(255,255,255,0.3)'}}></i>
                                )}
                                <span style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '8px',
                                    background: 'rgba(255,255,255,0.95)',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#1e293b',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <i className="ph ph-star-fill" style={{color: '#f59e0b'}}></i>
                                    {place.rating}
                                </span>
                            </div>
                            
                            {/* Content */}
                            <div style={{padding: '16px'}}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '4px'
                                }}>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        color: place.type === 'hotel' ? '#8b5cf6' : '#f59e0b',
                                        background: place.type === 'hotel' ? '#ede9fe' : '#fef3c7',
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        {place.type}
                                    </span>
                                    <span style={{fontSize: '12px', color: '#94a3b8'}}>{place.price}</span>
                                </div>
                                
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#1e293b'
                                }}>
                                    {place.name}
                                </h3>
                                
                                <p style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '13px',
                                    color: '#64748b',
                                    lineHeight: '1.5'
                                }}>
                                    {place.desc}
                                </p>
                                
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '16px',
                                    fontSize: '12px',
                                    color: '#94a3b8'
                                }}>
                                    <i className="ph ph-map-pin"></i>
                                    {place.address}
                                </div>
                                
                                {/* Action Buttons */}
                                <div style={{
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <a 
                                        href={place.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            padding: '10px',
                                            background: place.type === 'hotel' ? '#8b5cf6' : '#f59e0b',
                                            color: 'white',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                                    >
                                        <i className="ph ph-globe"></i>
                                        Website
                                    </a>
                                    <a 
                                        href={place.googleMaps} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            padding: '10px',
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                                        onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                                    >
                                        <i className="ph ph-map-trifold"></i>
                                        Directions
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}


            {/* Zone Info Panel (Appears only when a zone is clicked) */}
            {selectedZone && (
                <div className="zone-info-panel active" style={{ zIndex: 1000 }}>
                    <button className="close-zone-panel" onClick={() => setSelectedZone(null)}>
                        <i className="ph ph-x"></i>
                    </button>
                    <h3>{selectedZone.name}</h3>
                    <div className="zone-info-grid">
                        <div className="zone-info-item">
                            <span className="zone-info-label">STATUS</span>
                            <span className="zone-info-value">
                                {selectedZone.status?.toLowerCase() === 'open' ? '🟢 Open' : selectedZone.status?.toLowerCase() === 'closed' ? '🔴 Closed' : '🟡 Caution'}
                            </span>
                        </div>
                        <div className="zone-info-item">
                            <span className="zone-info-label">BEST TIME</span>
                            <span className="zone-info-value">{selectedZone.bestTime}</span>
                        </div>
                        <div className="zone-info-item">
                            <span className="zone-info-label">TOP ANIMALS</span>
                            <span className="zone-info-value">{selectedZone.animals}</span>
                        </div>
                        <div className="zone-info-item">
                            <span className="zone-info-label">ROAD CONDITION</span>
                            <span className="zone-info-value">{selectedZone.road}</span>
                        </div>
                        <div className="zone-info-item">
                            <span className="zone-info-label">WEATHER</span>
                            <span className="zone-info-value">{selectedZone.weather}</span>
                        </div>
                        <div className="zone-info-item">
                            <span className="zone-info-label">DANGER LEVEL</span>
                            <span className="zone-info-value">{selectedZone.danger}</span>
                        </div>
                    </div>
                </div>
            )}
        </MapContainer>
    );
}