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

  // State for map layer filters
  const [activeFilters, setActiveFilters] = useState(['sightings']);

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => {
      const isCurrentlyActive = prev.includes(filterId);
      return isCurrentlyActive
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId];
    });
  };

  const [blockTraffic, setBlockTraffic] = useState({});
  const [leopardHotspots, setLeopardHotspots] = useState([]);
  const [sightings, setSightings] = useState([]);

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
        

        <div className="sidebar-container">
          <MapFilters activeFilters={activeFilters} toggleFilter={toggleFilter} hideUI={hideUI} setHideUI={setHideUI} />
        </div>

        <RightSidePanel />
        
        <YalaMap isDarkMode={isDarkMode} jeeps={[]} sightings={sightings} activeFilters={activeFilters} blockTraffic={blockTraffic} leopardHotspots={leopardHotspots} />
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

    </>
  );
}

export default App;