import React, { useEffect, useState } from "react";
import NavBar from "./NavBar"
import RoadRiskPlayground from "./RoadRiskPlayground";
import InfoPanel from "./InfoPanel";
import MapComponent from "./MapComponent";
import ControlsCard from "./ControlsCard";
import ResultsCard from "./ResultsCard";
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import 'mapbox-gl/dist/mapbox-gl.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [activeSection, setActiveSection] = useState('');

  const [origin, setOrigin] = useState(null);         // {lng, lat, label}
  const [destination, setDestination] = useState(null); // {lng, lat, label}
  const [travelDateTimeText, setTravelDateTimeText] = useState(""); // MUST BE in 'YYY-MM-DDTHH:mm:ss' format

  const [modelInputs, setModelInputs] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const selectActiveSelection = (section) => {
    setActiveSection(prev => (prev === section ? '' : section));
  }

  // Set travelDateTime to current time if it hasn't been set yet
  useEffect(() => {
    if (travelDateTimeText.length > 0) {
      return
    }

    // Initialize to now in UTC timezone
    const msTravelTime = new Date().getTime();

    // Determine offset by multiplying minutes offset by 60 seconds and 1000 milliseconds
    const msPerMinute = 60 * 1000;
    const msTimezoneOffset = new Date().getTimezoneOffset() * msPerMinute;
    const localDateTime = new Date(msTravelTime - msTimezoneOffset);

    // Set to string in 'YYY-MM-DDTHH:mm:ss' format
    var nowLocalDateTimeString = localDateTime.toISOString().slice(0,19)
    nowLocalDateTimeString = nowLocalDateTimeString.slice(0,19)
    setTravelDateTimeText(nowLocalDateTimeString);
  }, [travelDateTimeText, setTravelDateTimeText]);

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
              travelDateTime={travelDateTimeText}
              setModelInputs = {setModelInputs}
              setPrediction = {setPrediction}
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
              travelDateTimeText={travelDateTimeText}
              setTravelDateTimeText={setTravelDateTimeText}
            />
            <ResultsCard
              prediction={prediction}
              modelInputs={modelInputs}
            />
            <InfoPanel activeSection={activeSection} />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
