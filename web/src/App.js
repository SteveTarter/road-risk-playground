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
  const [activeInfoSection, setActiveInfoSection] = useState('');

  const [origin, setOrigin] = useState(null);         // {lng, lat, label}
  const [destination, setDestination] = useState(null); // {lng, lat, label}
  const [travelDateTimeText, setTravelDateTimeText] = useState(""); // MUST BE in 'YYY-MM-DDTHH:mm:ss' format

  const [modelInputs, setModelInputs] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const [pickTarget, setPickTarget] = useState(null); // 'origin' | 'destination' | null

  const selectActiveInfoSection = (section) => {
    setActiveInfoSection(prev => (prev === section ? '' : section));
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
      <NavBar onSelect={selectActiveInfoSection} />
      <Container fluid className="py-3 bg-light">
        <InfoPanel
          activeInfoSection={activeInfoSection}
          clearActiveInfoSection={() => setActiveInfoSection('')}
        />
        {!activeInfoSection &&
          <>
            <RoadRiskPlayground />
            <Row className="g-3">
              {/* Other cards in the left column */}
              <Col xs={12} md={4}>
                <ControlsCard
                  origin={origin}
                  destination={destination}
                  onOriginChange={setOrigin}
                  onDestinationChange={setDestination}
                  travelDateTimeText={travelDateTimeText}
                  setTravelDateTimeText={setTravelDateTimeText}
                  pickTarget={pickTarget}
                  onStartPick={setPickTarget}
                  onCancelPick={() => setPickTarget(null)}
                />
                <ResultsCard
                  prediction={prediction}
                  modelInputs={modelInputs}
                />
              </Col>
              {/* Map in right column */}
              <Col xs={12} md={8}>
                <MapComponent
                  origin={origin}
                  destination={destination}
                  onOriginChange={setOrigin}
                  onDestinationChange={setDestination}
                  travelDateTime={travelDateTimeText}
                  setModelInputs={setModelInputs}
                  setPrediction={setPrediction}
                  pickTarget={pickTarget}
                  onCancelPick={() => setPickTarget(null)}
                />
              </Col>
            </Row>
          </>
        }
      </Container>
    </>
  );
}

export default App;
