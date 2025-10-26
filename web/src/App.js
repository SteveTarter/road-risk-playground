import React, { useState } from "react";
import NavBar from "./NavBar"
import RoadRiskPlayground from "./RoadRiskPlayground";
import InfoPanel from "./InfoPanel";
import MapComponent from "./MapComponent";
import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
  const [activeSection, setActiveSection] = useState('');

  const selectActiveSelection = (section) => {
    setActiveSection(prev => (prev === section ? '' : section));
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <NavBar onSelect={selectActiveSelection} />
      <RoadRiskPlayground />
      <hr />
      <InfoPanel activeSection={activeSection} />
      <MapComponent />
    </div>
  );
}

export default App;
