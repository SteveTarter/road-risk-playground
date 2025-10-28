import React, { useState } from "react";
import NavBar from "./NavBar"
import RoadRiskPlayground from "./RoadRiskPlayground";
import InfoPanel from "./InfoPanel";
import MapComponent from "./MapComponent";
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import 'mapbox-gl/dist/mapbox-gl.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [activeSection, setActiveSection] = useState('');

  const selectActiveSelection = (section) => {
    setActiveSection(prev => (prev === section ? '' : section));
  }

  return (
    <>
      <NavBar onSelect={selectActiveSelection} />
      <Container fluid className="py-3 bg-light">
        <Row className="g-3">
          {/* Map in left column */}
          <Col xs={12} md={8}>
            <MapComponent />
          </Col>

          {/* Other cards in the right column */}
          <Col xs={12} md={4}>
            <RoadRiskPlayground />
            <InfoPanel activeSection={activeSection} />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
