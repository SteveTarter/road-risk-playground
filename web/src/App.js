import React, { useState } from "react";
import NavBar from "./NavBar"
import RoadRiskPlayground from "./RoadRiskPlayground";
import InfoPanel from "./InfoPanel";
import MapComponent from "./MapComponent";
import ControlsCard from "./ControlsCard";
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import 'mapbox-gl/dist/mapbox-gl.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [activeSection, setActiveSection] = useState('');

  const [origin, setOrigin] = useState(null);         // {lng, lat, label}
  const [destination, setDestination] = useState(null); // {lng, lat, label}
  const [travelDateTime, setTravelDateTime] = useState(null); // MUST BE in 'YYY-MM-DDTHH:mm:ss' format

  const selectActiveSelection = (section) => {
    setActiveSection(prev => (prev === section ? '' : section));
  }

  // Set travelDateTime if it hasn't been set yet
  if(!travelDateTime) {
    new setTravelDateTime(new Date().toISOString());
  }

  return (
    <>
      <NavBar onSelect={selectActiveSelection} />
      <Container fluid className="py-3 bg-light">
        <Row className="g-3">
          {/* Map in left column */}
          <Col xs={12} md={8}>
            <MapComponent
              origin={origin}
              destination={destination}
              travelDateTime={travelDateTime}
            />
          </Col>

          {/* Other cards in the right column */}
          <Col xs={12} md={4}>
            <RoadRiskPlayground />
            <ControlsCard
              origin={origin}
              destination={destination}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              travelDateTime={travelDateTime}
              onTravelDateTimeChange={setTravelDateTime}
            />
            <InfoPanel activeSection={activeSection} />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
