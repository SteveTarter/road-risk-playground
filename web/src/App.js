import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // eslint-disable-next-line
  const [color, setColor] = useState("#ff7cbf")
  const [origin, setOrigin] = useState(null);         // {lng, lat, label}
  const [destination, setDestination] = useState(null); // {lng, lat, label}
  const [travelDateTimeText, setTravelDateTimeText] = useState(""); // 'YYYY-MM-DD HH:mm' format to match chooser
  const [pickTarget, setPickTarget] = useState(null); // 'origin' | 'destination' | null

  const [modelInputs, setModelInputs] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [routeData, setRouteData] = useState(null);

  const [status, setStatus] = useState("idle");       // idle | loading | error | done
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  const canCompute = !!origin && !!destination && !!travelDateTimeText;

  const requestPayload = useMemo(() => ({
    o_lat: origin?.lat, o_lng: origin?.lng,
    d_lat: destination?.lat, d_lng: destination?.lng,
    date_str: travelDateTimeText
  }), [origin, destination, travelDateTimeText]);

  const computeRisk = useCallback(async () => {
    if (!canCompute) {
      return;
    }

    try {
      setStatus("loading");
      setError(null);

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const url = `${process.env.REACT_APP_API_BASE_URL}/drive-risk`;

      const response = await fetch(url, {
        method: 'post',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      var routeData = data.mapbox_data.routes[0].geometry
      setModelInputs(data.model_inputs);
      setPrediction(data.prediction);
      setRouteData(routeData);
      setStatus("done");
    } catch (error) {
      console.error("Error calling prediction model:", error);
      setStatus("error");
      setError(error);
    }
  }, [canCompute, requestPayload]);

  const cancelCompute = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  const onOriginChange = useCallback((orig) => {
    setRouteData(null);
    setOrigin(orig)
  }, [setOrigin, setRouteData]);

  const onDestinationChange = useCallback((dest) => {
    setRouteData(null);
    setDestination(dest)
  }, [setDestination, setRouteData]);

  const selectActiveInfoSection = (section) => {
    setActiveInfoSection(prev => (prev === section ? '' : section));
  }

  // Invalidate the routeData if either origin or destination
  // Set travelDateTime to current time if it hasn't been set yet
  useEffect(() => {
    if (travelDateTimeText.length > 0) {
      return
    }

    // Initialize time of travel to now.
    const now = new Date();
    const localMs = now.getTime() - now.getTimezoneOffset() * 60000;
    var localIso = new Date(localMs).toISOString().slice(0,16); // YYYY-MM-DDTHH:mm
    localIso = localIso.slice(0,10) + ' ' + localIso.slice(11,16); // YYYY-MM-DD HH:mm
    setTravelDateTimeText(localIso);
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
                  onOriginChange={onOriginChange}
                  onDestinationChange={onDestinationChange}
                  travelDateTimeText={travelDateTimeText}
                  setTravelDateTimeText={setTravelDateTimeText}
                  pickTarget={pickTarget}
                  onStartPick={setPickTarget}
                  onCancelPick={() => setPickTarget(null)}
                  onComputeRisk={computeRisk}
                  canCompute={canCompute}
                  isComputing={status === "loading"}
                  onCancelCompute={cancelCompute}
                />
                <ResultsCard
                  prediction={prediction}
                  modelInputs={modelInputs}
                  status={status}
                  error={error}
                  color={color}
                />
              </Col>
              {/* Map in right column */}
              <Col xs={12} md={8}>
                <MapComponent
                  origin={origin}
                  destination={destination}
                  routeData={routeData}
                  onOriginChange={onOriginChange}
                  onDestinationChange={onDestinationChange}
                  travelDateTime={travelDateTimeText}
                  pickTarget={pickTarget}
                  onCancelPick={() => setPickTarget(null)}
                  status={status}
                  color={color}
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
