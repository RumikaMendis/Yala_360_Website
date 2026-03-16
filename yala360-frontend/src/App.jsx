import { useState, useEffect } from 'react';
import * as turf from '@turf/turf';
import { officialYalaGeoJSON } from './data/yala_blocks';
import { db } from './firebase';
import { ref, push, onValue, remove } from 'firebase/database';
import './App.css';
import YalaMap from './components/YalaMap';
import RightSidePanel from './components/RightSidePanel';
import SightingTimeline from './components/SightingTimeline';
import WildlifeGallery from './components/WildlifeGallery';
import MapFilters from './components/MapFilters';
import PredictionPanel from './components/PredictionPanel';
import BestRoute from './components/BestRoute';
import EventsGrid from './components/EventsGrid';
import ActionFAB from './components/ActionFAB';
import ActionModals from './components/ActionModals';
import MapLegend from './components/MapLegend';
import RecentSightings from './components/RecentSightings';
import RangerCommandPanel from './components/RangerCommandPanel';
import OperationsPanel from './components/OperationsPanel';



// Mock leopard sighting records per block (simulated historical data)
const leopardSightings = [
  { animal: 'Leopard', block: 'Block 1' },
  { animal: 'Leopard', block: 'Block 1' },
  { animal: 'Leopard', block: 'Block 1' },
  { animal: 'Leopard', block: 'Block 1' },
  { animal: 'Elephant', block: 'Block 1' },
  { animal: 'Leopard', block: 'Block 2' },
  { animal: 'Leopard', block: 'Block 2' },
  { animal: 'Elephant', block: 'Block 2' },
  { animal: 'Leopard', block: 'Block 3' },
  { animal: 'Sloth Bear', block: 'Block 3' },
  { animal: 'Leopard', block: 'Block 4' },
  { animal: 'Leopard', block: 'Block 4' },
  { animal: 'Leopard', block: 'Block 4' },
  { animal: 'Elephant', block: 'Block 5' },
];

function App() {
  // This state replaces your localStorage/DOM manipulation for dark mode!
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // State for map layer filters
  const [activeFilters, setActiveFilters] = useState(['jeeps', 'sightings']);

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => {
      const isCurrentlyActive = prev.includes(filterId);
      if (filterId === 'ranger-mode') {
        console.log("Ranger View toggled! New state:", !isCurrentlyActive);
      }
      return isCurrentlyActive
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId];
    });
  };

  // Generate random jeeps INSIDE park blocks using Turf.js
  const generateJeepsInsidePark = () => {
    const jeepList = [];
    let idCounter = 100;
    // Distribute jeeps across blocks for realistic traffic density
    const jeepsPerBlock = [5, 3, 2, 2, 1, 1, 1]; // Block 1 gets the most (main safari block)

    officialYalaGeoJSON.features.forEach((feature, blockIndex) => {
      const count = jeepsPerBlock[blockIndex] || 1;
      const bbox = turf.bbox(feature);

      for (let i = 0; i < count; i++) {
        let point;
        let attempts = 0;
        // Keep generating random points until one falls inside the polygon
        do {
          point = turf.randomPoint(1, { bbox }).features[0];
          attempts++;
        } while (!turf.booleanPointInPolygon(point, feature) && attempts < 100);

        if (turf.booleanPointInPolygon(point, feature)) {
          const [lng, lat] = point.geometry.coordinates;
          jeepList.push({
            id: `J-${idCounter++}`,
            lat, lng,
            trail: [],
            block: feature.properties.name,
            speed: Math.floor(Math.random() * 15) + 5,
            lastUpdate: Date.now()
          });
        }
      }
    });
    return jeepList;
  };

  // State to hold our live jeep data
  const [jeeps, setJeeps] = useState(() => generateJeepsInsidePark());
  const [blockTraffic, setBlockTraffic] = useState({});
  const [leopardHotspots, setLeopardHotspots] = useState([]);
  const [sightings, setSightings] = useState([]);

      // Mock leopard sighting records per block (simulated historical data)

  useEffect(() => {
    const interval = setInterval(() => {
      setJeeps(prevJeeps => {
        const newJeeps = prevJeeps.map(jeep => {
          // Try to move, but stay inside park
          let newLat = jeep.lat + (Math.random() - 0.5) * 0.001;
          let newLng = jeep.lng + (Math.random() - 0.5) * 0.001;
          
          const pt = turf.point([newLng, newLat]);
          const isInside = officialYalaGeoJSON.features.some(f => 
            turf.booleanPointInPolygon(pt, f)
          );
          
          // If new position is outside, DON'T MOVE (stay at current)
          if (!isInside) {
            newLat = jeep.lat;
            newLng = jeep.lng;
          }
          
          // Calculate speed for display
          const speed = Math.floor(Math.random() * 15) + 5; // 5-20 km/h
          
          return { 
            ...jeep, 
            lat: newLat, 
            lng: newLng, 
            speed,
            lastUpdate: Date.now(),
            trail: [...(jeep.trail || []), [newLat, newLng]].slice(-30) // Keep last 30 points
          };
        });

        // 3. Update Traffic Density per block
        const trafficCounts = {};
        newJeeps.forEach(j => {
          const p = turf.point([j.lng, j.lat]);
          officialYalaGeoJSON.features.forEach(f => {
            if (turf.booleanPointInPolygon(p, f)) {
              trafficCounts[f.properties.name] = (trafficCounts[f.properties.name] || 0) + 1;
            }
          });
        });
        setBlockTraffic(trafficCounts);

        // 4. Detect Leopard Hotspots
        const leopardCounts = {};
        leopardSightings.forEach(s => {
          if (s.animal === 'Leopard') {
            leopardCounts[s.block] = (leopardCounts[s.block] || 0) + 1;
          }
        });
        const detectedHotspots = Object.keys(leopardCounts).filter(b => leopardCounts[b] >= 3);
        setLeopardHotspots(detectedHotspots);

        return newJeeps;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Firebase sightings in real-time
  useEffect(() => {
    const sightingsRef = ref(db, 'sightings');
    onValue(sightingsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setSightings([]);
        return;
      }

      const now = Date.now();
      const validSightings = [];
      const EXPIRY_TIME = 90 * 60 * 1000; // 1.5 hours (90 minutes)

      Object.entries(data).forEach(([id, sighting]) => {
        const age = now - sighting.time;
        if (age > EXPIRY_TIME) {
          // Delete old sighting from Firebase
          remove(ref(db, `sightings/${id}`));
        } else {
          validSightings.push({
            ...sighting,
            id,
            isNew: age < 30000 // Flag as new if reported in last 30 seconds
          });
        }
      });

      setSightings(validSightings);
    });
  }, []);

  // State for Map Visibility
  const [hideUI, setHideUI] = useState(false);

  // Better React Way: Watch state change with useEffect
  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    document.body.classList.toggle('hide-ui', hideUI);
  }, [hideUI]);

  useEffect(() => {
    document.body.classList.toggle('ranger-mode-active', activeFilters.includes('ranger-mode'));
  }, [activeFilters]);


  const toggleTheme = (e) => {
    e.preventDefault();
    setIsDarkMode(prev => !prev);
  };


  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="logo">YALA360</div>
        <ul className="nav-links">
          <li><a href="#">HOME</a></li>
          <li><a href="#">ABOUT YALA</a></li>
          <li><a href="#">BOOKING</a></li>
          <li><a href="#" className="active">MAP</a></li>
          <li><a href="#">GALLERY</a></li>
          <li><a href="#">REVIEWS</a></li>
          <li><a href="#">RANKINGS</a></li>
          <li><a href="#">CONTACT</a></li>
          <li>
            <a href="#" id="theme-toggle" className="btn-icon" title="Toggle Dark Mode" onClick={toggleTheme}>
              {/* Dynamic icon change based on React state */}
              <i className={isDarkMode ? "ph ph-sun" : "ph ph-moon"}></i>
            </a>
          </li>
          <li><a href="#" className="btn-outline">ADMIN</a></li>
        </ul>
      </nav>

      {/* Header Section */}
      <header className="page-header">
        <h1>Interactive Wilderness</h1>
        <p>Explore Yala's heartbeat through real-time data and historical landmarks.</p>
      </header>

      {/* Placeholder for the Map */}
      {/* Main Map Container */}
      <main className="map-container">
        
        {/* Live Jeep Counter Widget */}
        <div className="live-counter">
          <span className="pulse-dot"></span>
          <span>{jeeps.length} Jeeps Active</span>
          <small>{Object.values(blockTraffic).reduce((a,b) => a+b, 0)} in park</small>
        </div>

        <div className="sidebar-container">
          <MapFilters activeFilters={activeFilters} toggleFilter={toggleFilter} hideUI={hideUI} setHideUI={setHideUI} />
          {activeFilters.includes('ranger-mode') && (
            <RangerCommandPanel sightings={sightings} activeFilters={activeFilters} />
          )}
        </div>

        {activeFilters.includes('ranger-mode') ? (
          <div className="right-panel-container">
             <OperationsPanel sightings={sightings} safariCount={jeeps.length} blockTraffic={blockTraffic} />
          </div>
        ) : (
          <RightSidePanel safariCount={jeeps.length} blockTraffic={blockTraffic} sightings={sightings} />
        )}
        
        <YalaMap isDarkMode={isDarkMode} jeeps={jeeps} sightings={sightings} activeFilters={activeFilters} blockTraffic={blockTraffic} leopardHotspots={leopardHotspots} />
      </main>

      {/* Analytics & History Area */}
      <div id="sighting-history" className="timeline-container">
        <SightingTimeline sightings={sightings} />
        <aside className="analytics-sidebar">
          {/* Passing live data for real-time recommendations */}
          <BestRoute blockTraffic={blockTraffic} />
          <PredictionPanel blockTraffic={blockTraffic} />
        </aside>
      </div>

      {/* Info Sections */}
      <EventsGrid />
      <WildlifeGallery />

      {/* Floating Action Menu & Modals */}
      <ActionFAB onOpenModal={setActiveModal} />
      <ActionModals 
        activeModal={activeModal} 
        closeModal={() => setActiveModal(null)} 
      />
    </>
  );
}

export default App;