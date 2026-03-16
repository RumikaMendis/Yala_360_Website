import React, { useState, useEffect } from 'react';
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "../firebase";
import { officialYalaGeoJSON } from '../data/yala_blocks'; // Adjust path if needed
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

const getLocationName = async (lat, lng) => {
    // Debug: log what we're searching for
    // eslint-disable-next-line no-console
    console.log("Looking up:", lat, lng);
    
    // Check Yala blocks first
    if (lat > 6.35 && lat < 6.42 && lng > 81.45 && lng < 81.52) return "Block I (Main Zone)";
    if (lat > 6.42 && lat < 6.48) return "Block II (Northern)";
    if (lat > 6.30 && lat < 6.35) return "Block III (Coastal)";
    if (lat > 6.25 && lat < 6.30) return "Near Palatupana Entrance";
    
    // Fetch from OpenStreetMap
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`
        );
        const data = await response.json();
        
        // eslint-disable-next-line no-console
        console.log("API Response:", data); // Check console for this!
        
        // More robust address checking (OSM has many field types)
        const addr = data.address || {};
        const location = 
            addr.city || 
            addr.town || 
            addr.village || 
            addr.hamlet ||
            addr.suburb ||
            addr.locality ||
            addr.county ||
            addr.state_district ||
            "Nearby Area";
            
        // Add state/district if available for more context
        const region = addr.state || "";
        return region ? `${location}, ${region}` : `${location}, Sri Lanka`;
        
    } catch {
        // eslint-disable-next-line no-console
        console.error("Geocoding failed");
        // Fallback: Show coordinates if API fails
        return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    }
};

export default function ActionModals({ activeModal, closeModal }) {
    const [successMsg, setSuccessMsg] = useState('');
    const [validationError, setValidationError] = useState('');
    const [gpsCoords, setGpsCoords] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    const getAnimalEmoji = (animal) => {
        const map = {
            'leopard': '🐆',
            'elephant': '🐘',
            'bear': '🐻',
            'croc': '🐊',
            'peacock': '🦚',
            'other': '🐾'
        };
        return map[animal?.toLowerCase()] || '🐾';
    };

    const [severity, setSeverity] = useState('medium');
    const [submitting, setSubmitting] = useState(false);
    const [showInfo, setShowInfo] = useState(null); // Which severity info to show
    const [manualLocation, setManualLocation] = useState('Block 1'); // Fallback for Emergency/Roadblock
    const [isInsidePark, setIsInsidePark] = useState(false);

    // Sighting specific states
    const [selectedAnimal, setSelectedAnimal] = useState('');
    const [manualBlock, setManualBlock] = useState('Block 1');
    const [useManualLocation, setUseManualLocation] = useState(false);

    const isEmergency = activeModal === 'emergency';
    const theme = isEmergency ? {
        primary: '#ef4444',
        secondary: '#fee2e2',
        icon: 'ph-siren',
        title: 'Emergency SOS',
        subtitle: 'Life-threatening situation'
    } : activeModal === 'roadblock' ? {
        primary: '#f59e0b',
        secondary: '#fef3c7',
        icon: 'ph-traffic-cone',
        title: 'Report Roadblock',
        subtitle: 'Route obstruction or hazard'
    } : { // Default theme for others (like sighting - we'll handle sighting specifically later, but need a fallback for the render)
        primary: '#10b981',
        secondary: '#dcfce7',
        icon: 'ph-paw-print',
        title: 'Action',
        subtitle: 'Report details'
    };

    useEffect(() => {
        let mounted = true;
        if ((activeModal === 'emergency' || activeModal === 'roadblock' || activeModal === 'sighting') && !gpsCoords) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setGpsLoading(true);
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        // eslint-disable-next-line no-console
                        console.log("Got coordinates:", pos.coords.latitude, pos.coords.longitude);
                        
                        if (!mounted) return;
                        
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        
                        // Check if inside Yala park boundaries
                        const userPoint = point([lng, lat]); // Turf uses [lng, lat] order
                        let detectedBlock = null;
                        const inside = officialYalaGeoJSON.features.some(feature => {
                            if (booleanPointInPolygon(userPoint, feature)) {
                                detectedBlock = feature.properties.name;
                                return true;
                            }
                            return false;
                        });
                        
                        setIsInsidePark(inside);
                        
                        const locationName = await getLocationName(lat, lng);
                        
                        if (mounted) {
                            setGpsCoords({ 
                                lat: lat, 
                                lng: lng, 
                                accuracy: pos.coords.accuracy,
                                name: locationName,
                                insidePark: inside,
                                block: detectedBlock
                            });
                            setGpsLoading(false);
                        }
                    },
                    (err) => {
                        if (mounted) {
                            // eslint-disable-next-line no-console
                            console.log("GPS error (expected if not at park):", err);
                            setGpsLoading(false);
                            // Don't set error - allow manual fallback
                        }
                    },
                    { enableHighAccuracy: true, timeout: 8000 }
                );
            } else if (mounted) {
                setGpsLoading(false);
            }
        }
        return () => { mounted = false; };
    }, [activeModal, gpsCoords]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (activeModal === 'sighting') {
            if (!selectedAnimal) {
                setValidationError('Please select an animal');
                return;
            }

            setSubmitting(true);
            
            try {
                // Determine location
                let locationData;
                if (useManualLocation || !gpsCoords?.lat) {
                    // Replace the entire getRandomPointInBlock function with this:
                    const getBlockCenter = (blockName) => {
                        const feature = officialYalaGeoJSON.features.find(f => f.properties.name === blockName);
                        
                        if (!feature) {
                            console.error("Block not found:", blockName);
                            return { lat: 6.310, lng: 81.460 };
                        }
                        
                        // Calculate centroid by averaging all vertices
                        const coords = feature.geometry.coordinates[0];
                        let sumLat = 0, sumLng = 0;
                        
                        coords.forEach(([lng, lat]) => {
                            sumLng += lng;
                            sumLat += lat;
                        });
                        
                        const centerLng = sumLng / coords.length;
                        const centerLat = sumLat / coords.length;
                        
                        // Add small random jitter so multiple reports don't stack exactly
                        const jitter = () => (Math.random() - 0.5) * 0.005; // ~500m max
                        
                        return {
                            lat: centerLat + jitter(),
                            lng: centerLng + jitter()
                        };
                    };

                    const center = getBlockCenter(manualBlock);
                    
                    console.log("Selected block:", manualBlock);
                    console.log("Generated center:", center);
                    console.log("Feature found:", officialYalaGeoJSON.features.find(f => f.properties.name === manualBlock)?.properties);
                    
                    locationData = {
                        exactLocation: center,
                        publicLocation: {  // Properly rounded for anti-poaching
                            lat: Math.round(center.lat * 100) / 100,
                            lng: Math.round(center.lng * 100) / 100
                        },
                        block: manualBlock,
                        manual: true,
                        lat: center.lat,  // Root level for map fallback
                        lng: center.lng
                    };
                } else {
                    const exactLat = gpsCoords.lat;
                    const exactLng = gpsCoords.lng;
                    const publicLat = Math.round(exactLat * 100) / 100;
                    const publicLng = Math.round(exactLng * 100) / 100;
                    
                    locationData = {
                        lat: exactLat,
                        lng: exactLng,
                        exactLocation: { lat: exactLat, lng: exactLng },
                        publicLocation: { lat: publicLat, lng: publicLng },
                        block: gpsCoords.block || manualBlock,
                        manual: false
                    };
                }

                console.log("Submitting sighting data:", { animal: selectedAnimal, ...locationData });

                // OLD: 30 minute delay (now 45-60s)
                const delayMs = 45000 + Math.random() * 15000;
                
                const notes = e.target.notes?.value || '';
                
                // Flatten location data so map can access it directly
                const sightingData = {
                    animal: selectedAnimal,
                    ...locationData,  // Spreads exactLocation, publicLocation, block, manual to root
                    notes,
                    visibility: 'pending',
                    delayUntil: Date.now() + delayMs,
                    time: Date.now(),
                    timestamp: serverTimestamp()
                };

                // Add root-level lat/lng for fallback compatibility
                if (locationData.exactLocation) {
                    sightingData.lat = locationData.exactLocation.lat;
                    sightingData.lng = locationData.exactLocation.lng;
                }

                console.log("Pushing to Firebase:", sightingData);
                await push(ref(db, "sightings"), sightingData);
                console.log("Sighting submitted successfully!");

                // Delay the activity feed notification too
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('addFeedEvent', {
                        detail: { 
                            icon: getAnimalEmoji(selectedAnimal), 
                            text: `New ${selectedAnimal} sighting in ${locationData.block || 'Yala'}`, 
                            type: 'sighting'
                        }
                    }));
                }, delayMs);

                setSuccessMsg('Sighting Reported');
                setTimeout(() => { 
                    closeModal(); 
                    setSuccessMsg(''); 
                    setSubmitting(false);
                    setSelectedAnimal('');
                    setUseManualLocation(false);
                    setGpsCoords(null);
                }, 2000);

            } catch (err) {
                console.error("Submission Error:", err);
                setValidationError(err.message || "Failed to send. Check your connection.");
                setSubmitting(false);
            }
            return;
        }

        // Handle Emergency and Roadblock
        setSubmitting(true);
        const desc = e.target.description?.value?.trim();
        
        if (!desc) { 
            setValidationError('Please describe the situation');
            setSubmitting(false);
            return;
        }

        try {
            const endpoint = activeModal === 'emergency' ? "emergencies" : "roadblocks";
            const location = gpsCoords?.lat ? gpsCoords : { block: manualLocation, manual: true };
            
            const reportData = {
                type: activeModal,
                description: desc,
                severity: activeModal === 'emergency' ? severity : 'medium',
                location,
                status: 'active',
                timestamp: serverTimestamp(),
                time: Date.now()
            };
            
            await push(ref(db, endpoint), reportData);

            setSuccessMsg(activeModal === 'emergency' ? 'SOS Sent' : 'Report Submitted');
            setTimeout(() => { closeModal(); setSuccessMsg(''); setGpsCoords(null); }, 2500);

        } catch (err) {
            console.error(err);
            setValidationError('Failed to send. Check connection.');
            setSubmitting(false);
        }
    };

    const severityConfig = {
        low: { label: 'Standard', icon: 'ph-plus', color: '#10b981', desc: 'Minor issue, no immediate danger' },
        medium: { label: 'Urgent', icon: 'ph-ambulance', color: '#f59e0b', desc: 'Medical or vehicle assistance needed' },
        high: { label: 'Critical', icon: 'ph-warning-octagon', color: '#ef4444', desc: 'Life threatening or animal attack' }
    };

    if (!activeModal) return null;

    // Special completely different render for history as it has no form
    if (activeModal === 'history') {
        return (
             <div className="modal-overlay active" onClick={closeModal}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Sighting History</h2>
                        <button className="close-modal" onClick={closeModal}>
                            <i className="ph ph-x"></i>
                        </button>
                    </div>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <i className="ph ph-clock-counter-clockwise" style={{ fontSize: '48px', color: 'var(--accent-gold)', marginBottom: '16px', display: 'block' }}></i>
                        <p>No historical sightings for your session yet.</p>
                    </div>
                </div>
            </div>
        )
    }

    if (activeModal === 'sighting') {
        const sightingTheme = {
            primary: '#10b981',
            secondary: '#dcfce7',
            icon: 'ph-paw-print',
            title: 'Report Animal Sighting',
            subtitle: 'Smart detection with live location'
        };

        const animals = [
            {value: 'leopard', label: 'Leopard', icon: '🐆', color: '#f59e0b'},
            {value: 'elephant', label: 'Elephant', icon: '🐘', color: '#6366f1'},
            {value: 'bear', label: 'Sloth Bear', icon: '🐻', color: '#4a4a4a'},
            {value: 'croc', label: 'Crocodile', icon: '🐊', color: '#10b981'},
            {value: 'peacock', label: 'Peacock', icon: '🦚', color: '#8b5cf6'},
            {value: 'other', label: 'Other', icon: '🐾', color: '#6b7280'}
        ];

        const blocks = ['Block 1', 'Block 2', 'Block 3', 'Block 4', 'Block 5', 'Strict Nature Reserve'];

        return (
            <div className="modal-overlay active" onClick={closeModal}>
                <div className="modal-content compact-modal" onClick={e => e.stopPropagation()} 
                     style={{borderTop: `4px solid ${sightingTheme.primary}`, maxWidth: '420px', padding: 0}}>
                    
                    {/* Header */}
                    <div className="modal-header" style={{padding: '20px 20px 0 20px', border: 'none'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <div style={{
                                width: '44px', height: '44px',
                                background: sightingTheme.primary,
                                borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 4px 12px ${sightingTheme.primary}40`
                            }}>
                                <i className={`ph ${sightingTheme.icon}`} style={{fontSize: '22px', color: 'white'}}></i>
                            </div>
                            <div>
                                <h2 style={{margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937'}}>
                                    {sightingTheme.title}
                                </h2>
                                <p style={{margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280'}}>
                                    {sightingTheme.subtitle}
                                </p>
                            </div>
                        </div>
                        <button className="close-modal" onClick={closeModal}>
                            <i className="ph ph-x"></i>
                        </button>
                    </div>

                    {successMsg ? (
                        <div style={{textAlign: 'center', padding: '40px 20px'}}>
                            <div style={{
                                width: '64px', height: '64px',
                                background: sightingTheme.primary,
                                borderRadius: '50%',
                                margin: '0 auto 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                animation: 'pulse 2s infinite'
                            }}>
                                <i className="ph ph-check" style={{fontSize: '32px', color: 'white'}}></i>
                            </div>
                            <h3 style={{color: sightingTheme.primary, marginBottom: '4px'}}>{successMsg}</h3>
                            <p style={{color: '#6b7280', fontSize: '13px'}}>
                                Rangers notified of sighting
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{padding: '20px'}}>
                            
                            {/* ANIMAL SELECTION */}
                            <div style={{marginBottom: '20px'}}>
                                <label style={{
                                    fontSize: '11px', fontWeight: '700', color: '#9ca3af',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                    marginBottom: '12px', display: 'block'
                                }}>
                                    Animal Spotted *
                                </label>
                                
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                    {animals.map((animal) => (
                                        <button
                                            key={animal.value}
                                            type="button"
                                            onClick={() => setSelectedAnimal(animal.value)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '14px',
                                                border: `2px solid ${selectedAnimal === animal.value ? animal.color : '#e5e7eb'}`,
                                                background: selectedAnimal === animal.value ? `${animal.color}15` : 'white',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <span style={{fontSize: '24px'}}>{animal.icon}</span>
                                            <span style={{
                                                fontSize: '14px', 
                                                fontWeight: '600',
                                                color: selectedAnimal === animal.value ? animal.color : '#374151'
                                            }}>
                                                {animal.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* LOCATION SECTION */}
                            <div style={{marginBottom: '20px'}}>
                                <div style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    marginBottom: '10px'
                                }}>
                                    <label style={{
                                        fontSize: '11px', fontWeight: '700', color: '#9ca3af',
                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>
                                        Location
                                    </label>
                                    
                                    {/* Toggle GPS/Manual */}
                                    <button
                                        type="button"
                                        onClick={() => setUseManualLocation(!useManualLocation)}
                                        style={{
                                            fontSize: '11px',
                                            color: useManualLocation ? '#f59e0b' : '#10b981',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <i className={`ph ${useManualLocation ? 'ph-map-pin' : 'ph-crosshair'}`}></i>
                                        {useManualLocation ? 'Use GPS instead' : 'Select block manually'}
                                    </button>
                                </div>

                                {/* GPS Location Display */}
                                {!useManualLocation && (
                                    <>
                                        {gpsLoading ? (
                                            <div style={{
                                                padding: '16px', textAlign: 'center',
                                                background: '#f9fafb', borderRadius: '10px',
                                                color: '#6b7280', fontSize: '13px'
                                            }}>
                                                <div style={{
                                                    width: '24px', height: '24px',
                                                    border: '2px solid #e5e7eb',
                                                    borderTopColor: sightingTheme.primary,
                                                    borderRadius: '50%',
                                                    margin: '0 auto 8px',
                                                    animation: 'spin 1s linear infinite'
                                                }}></div>
                                                Getting location...
                                            </div>
                                        ) : gpsCoords?.lat ? (
                                            <div style={{
                                                padding: '12px 16px',
                                                background: isInsidePark ? '#f0fdf4' : '#fef2f2',
                                                border: `1px solid ${isInsidePark ? '#86efac' : '#fecaca'}`,
                                                borderRadius: '10px'
                                            }}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px'
                                                }}>
                                                    <i className={`ph ${isInsidePark ? 'ph-check-circle' : 'ph-warning-circle'}`} 
                                                       style={{fontSize: '24px', color: isInsidePark ? '#22c55e' : '#ef4444'}}></i>
                                                    <div>
                                                        <div style={{fontWeight: '600', fontSize: '14px', color: '#1e293b'}}>
                                                            {gpsCoords.name || "Location detected"}
                                                        </div>
                                                        <div style={{fontSize: '12px', color: isInsidePark ? '#22c55e' : '#dc2626'}}>
                                                            {isInsidePark ? `✅ Inside ${gpsCoords.block || 'Park'}` : '❌ Outside Park - Switch to manual'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                padding: '16px',
                                                background: '#fef3c7',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <p style={{margin: '0 0 10px 0', fontSize: '13px', color: '#92400e'}}>
                                                    GPS unavailable or denied
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setUseManualLocation(true)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: '#f59e0b',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Select Block Manually
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* MANUAL BLOCK SELECTION */}
                                {useManualLocation && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '10px'
                                    }}>
                                        <p style={{margin: '0 0 12px 0', fontSize: '13px', color: '#1e40af'}}>
                                            <i className="ph ph-info" style={{marginRight: '6px'}}></i>
                                            Select which block you spotted the animal:
                                        </p>
                                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                                            {blocks.map(block => (
                                                <button
                                                    key={block}
                                                    type="button"
                                                    onClick={() => setManualBlock(block)}
                                                    style={{
                                                        padding: '10px 16px',
                                                        borderRadius: '8px',
                                                        border: '2px solid',
                                                        borderColor: manualBlock === block ? '#3b82f6' : '#e5e7eb',
                                                        background: manualBlock === block ? '#3b82f6' : 'white',
                                                        color: manualBlock === block ? 'white' : '#374151',
                                                        fontWeight: '600',
                                                        fontSize: '13px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {block === 'Strict Nature Reserve' ? 'SNR' : block}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* NOTES */}
                            <div style={{marginBottom: '20px'}}>
                                <label style={{
                                    fontSize: '11px', fontWeight: '700', color: '#9ca3af',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                    marginBottom: '8px', display: 'block'
                                }}>
                                    Additional Notes (Optional)
                                </label>
                                <textarea 
                                    name="notes"
                                    placeholder="e.g., Near waterhole, moving east, with cubs..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        minHeight: '80px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                ></textarea>
                            </div>

                            {validationError && (
                                <div style={{color: '#ef4444', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <i className="ph ph-warning-circle"></i>
                                    {validationError}
                                </div>
                            )}

                            {/* SUBMIT BUTTON */}
                            <button 
                                type="submit" 
                                disabled={submitting || (!useManualLocation && !gpsCoords?.lat && !isInsidePark) || !selectedAnimal}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: !selectedAnimal ? '#9ca3af' : 
                                              (!useManualLocation && !gpsCoords?.lat) ? '#f59e0b' : 
                                              sightingTheme.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    opacity: submitting ? 0.7 : 1
                                }}
                            >
                                {submitting ? (
                                    <>
                                        <div style={{
                                            width: '18px', height: '18px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: 'white',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }}></div>
                                        Submitting...
                                    </>
                                ) : !selectedAnimal ? (
                                    'SELECT AN ANIMAL'
                                ) : (!useManualLocation && !gpsCoords?.lat) ? (
                                    <>
                                        <i className="ph ph-map-pin"></i>
                                        ENABLE GPS OR SELECT MANUAL
                                    </>
                                ) : (
                                    <>
                                        <i className="ph ph-paw-print"></i>
                                        REPORT SIGHTING
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }


    // Default compact render for Emergency and Roadblock
    return (
        <div className="modal-overlay active" onClick={closeModal}>
            <div className="modal-content compact-modal" onClick={e => e.stopPropagation()} 
                 style={{borderTop: `4px solid ${theme.primary}`, maxWidth: '380px', padding: 0}}>
                
                {/* Header - Theme Specific */}
                <div className="modal-header" style={{padding: '20px 20px 0 20px', border: 'none'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{
                            width: '44px', height: '44px',
                            background: theme.primary,
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 4px 12px ${theme.primary}40`
                        }}>
                            <i className={`ph ${theme.icon}`} style={{fontSize: '22px', color: 'white'}}></i>
                        </div>
                        <div>
                            <h2 style={{margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937'}}>
                                {theme.title}
                            </h2>
                            <p style={{margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280'}}>
                                {theme.subtitle}
                            </p>
                        </div>
                    </div>
                    <button className="close-modal" onClick={closeModal} style={{background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af', cursor: 'pointer', outline: 'none'}}>
                        <i className="ph ph-x"></i>
                    </button>
                </div>

                {successMsg ? (
                    <div style={{textAlign: 'center', padding: '40px 20px'}}>
                        <div style={{
                            width: '64px', height: '64px',
                            background: theme.primary,
                            borderRadius: '50%',
                            margin: '0 auto 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'pulse 2s infinite'
                        }}>
                            <i className="ph ph-check" style={{fontSize: '32px', color: 'white'}}></i>
                        </div>
                        <h3 style={{color: theme.primary, marginBottom: '4px', fontSize: '18px'}}>{successMsg}</h3>
                        <p style={{color: '#6b7280', fontSize: '13px'}}>
                            {isEmergency ? 'Rangers notified' : 'Park authorities alerted'}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{padding: '20px'}}>
                        
                        {/* SEVERITY SELECTOR - Compact with Info Button */}
                        {isEmergency && (
                            <div style={{marginBottom: '20px'}}>
                                <label style={{
                                    fontSize: '11px', fontWeight: '700', color: '#9ca3af',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                    marginBottom: '10px', display: 'block'
                                }}>
                                    Emergency Level
                                </label>
                                
                                <div style={{display: 'flex', gap: '8px'}}>
                                    {Object.entries(severityConfig).map(([key, config]) => (
                                        <div key={key} style={{flex: 1, position: 'relative'}}>
                                            <button
                                                type="button"
                                                onClick={() => setSeverity(key)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 8px',
                                                    border: `2px solid ${severity === key ? config.color : '#e5e7eb'}`,
                                                    background: severity === key ? `${config.color}15` : 'white',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <i className={`ph ${config.icon}`} style={{
                                                    fontSize: '20px', 
                                                    color: severity === key ? config.color : '#9ca3af'
                                                }}></i>
                                                <span style={{
                                                    fontSize: '11px', 
                                                    fontWeight: '600',
                                                    color: severity === key ? config.color : '#374151'
                                                }}>
                                                    {config.label}
                                                </span>
                                            </button>
                                            
                                            {/* Info Button */}
                                            <button
                                                type="button"
                                                onClick={() => setShowInfo(showInfo === key ? null : key)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-6px',
                                                    right: '-6px',
                                                    width: '18px', height: '18px',
                                                    borderRadius: '50%',
                                                    background: '#6b7280',
                                                    color: 'white',
                                                    border: 'none',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 2
                                                }}
                                            >
                                                i
                                            </button>

                                            {/* Info Tooltip */}
                                            {showInfo === key && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '110%',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    background: '#1f2937',
                                                    color: 'white',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    width: '140px',
                                                    textAlign: 'center',
                                                    zIndex: 10,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                }}>
                                                    {config.desc}
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '-4px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%) rotate(45deg)',
                                                        width: '8px', height: '8px',
                                                        background: '#1f2937'
                                                    }}></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* LOCATION - Compact */}
                        <div style={{marginBottom: '20px'}}>
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                                <label style={{
                                    fontSize: '11px', fontWeight: '700', color: '#9ca3af',
                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                }}>
                                    Location
                                </label>
                                {gpsLoading && <span style={{fontSize: '11px', color: '#10b981'}}>Acquiring GPS...</span>}
                            </div>

                            {gpsCoords?.lat ? (
                                <>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '12px',
                                        background: isInsidePark ? '#f0fdf4' : '#fef2f2', // Green if inside, Red if outside
                                        border: `1px solid ${isInsidePark ? '#86efac' : '#fecaca'}`,
                                        borderRadius: '10px'
                                    }}>
                                        <i className={`ph ${isInsidePark ? 'ph-map-pin' : 'ph-prohibit'}`} 
                                           style={{fontSize: '20px', color: isInsidePark ? '#10b981' : '#ef4444'}}></i>
                                        <div style={{flex: 1}}>
                                            <div style={{fontWeight: '600', color: isInsidePark ? '#166534' : '#991b1b', fontSize: '14px'}}>
                                                {gpsCoords.name || "Acquiring location..."}
                                            </div>
                                            <div style={{fontSize: '11px', color: isInsidePark ? '#22c55e' : '#dc2626'}}>
                                                {isInsidePark ? '✅ Inside Park - Can Report' : '❌ Outside Park - Cannot Report'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {!isInsidePark && (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '10px',
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            color: '#dc2626',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <i className="ph ph-warning-circle"></i>
                                            You must be inside Yala National Park to report {isEmergency ? 'emergencies' : 'roadblocks'}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    {!gpsLoading && (
                                        <div style={{marginBottom: '8px'}}>
                                            <select 
                                                value={manualLocation}
                                                onChange={(e) => setManualLocation(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: '1px solid #e5e7eb',
                                                    fontSize: '14px',
                                                    background: 'white'
                                                }}
                                            >
                                                <option>Block 1 (Palatupana)</option>
                                                <option>Block 2</option>
                                                <option>Block 3</option>
                                                <option>Block 4</option>
                                                <option>Block 5</option>
                                                <option>Strict Nature Reserve</option>
                                            </select>
                                            <div style={{fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                <i className="ph ph-info"></i>
                                                GPS unavailable — using manual location
                                            </div>
                                        </div>
                                    )}
                                    {gpsLoading && (
                                        <div style={{
                                            padding: '16px', textAlign: 'center',
                                            background: '#f9fafb', borderRadius: '10px',
                                            color: '#6b7280', fontSize: '13px'
                                        }}>
                                            <div style={{
                                                width: '24px', height: '24px',
                                                border: '2px solid #e5e7eb',
                                                borderTopColor: theme.primary,
                                                borderRadius: '50%',
                                                margin: '0 auto 8px',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            Getting precise location...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* DESCRIPTION */}
                        <div style={{marginBottom: '20px'}}>
                            <label style={{
                                fontSize: '11px', fontWeight: '700', color: '#9ca3af',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                marginBottom: '8px', display: 'block'
                            }}>
                                Description
                            </label>
                            <textarea 
                                name="description"
                                placeholder={isEmergency ? "What's happening? Be specific..." : "What's blocking the road?"}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    minHeight: '80px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    outline: 'none'
                                }}
                            ></textarea>
                        </div>

                        {validationError && (
                            <div style={{color: '#ef4444', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                <i className="ph ph-warning-circle"></i>
                                {validationError}
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button 
                            type="submit" 
                            disabled={submitting || !gpsCoords?.lat || !isInsidePark}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: !isInsidePark ? '#9ca3af' : theme.primary, // Gray if outside
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: (!isInsidePark || submitting) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                opacity: (!isInsidePark || submitting) ? 0.7 : 1,
                                boxShadow: (!isInsidePark || submitting) ? 'none' : `0 4px 12px ${theme.primary}40`
                            }}
                        >
                            {!isInsidePark ? (
                                <span>OUTSIDE PARK BOUNDARIES</span>
                            ) : submitting ? (
                                <>
                                    <div style={{
                                        width: '18px', height: '18px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }}></div>
                                    {isEmergency ? 'Sending Alert...' : 'Submitting...'}
                                </>
                            ) : (
                                <>
                                    <i className={`ph ${theme.icon}`}></i>
                                    {isEmergency ? 'SEND EMERGENCY ALERT' : 'SUBMIT REPORT'}
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
            
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                .compact-modal { animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
