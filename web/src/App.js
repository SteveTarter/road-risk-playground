import React, {  useCallback, useEffect, useMemo, useRef, useState } from "react";
import NavBar from "./NavBar"
import RoadRiskPlayground from "./RoadRiskPlayground";
import InfoPanel from "./InfoPanel";
import MapComponent from "./MapComponent";
import ControlsCard from "./ControlsCard";
import ResultsCard from "./ResultsCard";
import { RoutesProvider, useRoutes } from "./Context/RoutesContext";
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import 'mapbox-gl/dist/mapbox-gl.css';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Inner app uses RoutesContext as the single source of truth.
 * Kept outside so <RoutesProvider> wraps the whole tree exactly once.
 */
function AppInner() {
  const [activeInfoSection, setActiveInfoSection] = useState('');
  const [pickTarget, setPickTarget] = useState(null); // 'origin' | 'destination' | null

  // eslint-disable-next-line
  const [color, setColor] = useState("#ff7cbf")

  const { active, updateActive, setActiveStatus, setActiveResult, addRoute } = useRoutes();

  const abortRef = useRef(null);
  const controlsCardRef = useRef(null);
  const mapComponentRef = useRef(null);
  const resultsCardRef = useRef(null);
  const hasInteractedRef = useRef(false);

  const canCompute = !!active?.origin && !!active?.destination && !!active?.travelDateTimeText;
  const isComputing = active?.status === "loading";

  const requestPayload = useMemo(() => {
    if(!active) {
      return null;
    }

    return {
      o_lat: active.origin?.lat,
      o_lng: active.origin?.lng,
      d_lat: active.destination?.lat,
      d_lng: active.destination?.lng,
      date_str: active.travelDateTimeText,
    };
  }, [active]);

  function extractEndpointsFromDirections(data) {
    const coords = data?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const [oLng, oLat] = coords[0];
      const [dLng, dLat] = coords[coords.length - 1];
      return {
        origin: { lng: oLng, lat: oLat, label: "" },
        destination: { lng: dLng, lat: dLat, label: "" },
      };
    }

    return null;
  }

  // Initialize the active route's travel time once, if empty
  useEffect(() => {
    if (!active) {
      return;
    }
    if (active.travelDateTimeText) {
      return;
    }

    const now = new Date();
    const localMs = now.getTime() - now.getTimezoneOffset() * 60000;
    let localIso = new Date(localMs).toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    localIso = localIso.slice(0, 10) + " " + localIso.slice(11, 16); // YYYY-MM-DD HH:mm
    updateActive({ travelDateTimeText: localIso });
  }, [active, updateActive]);

  // Ensure scroll to ControlCard doesn't occur on initial paint of window.
  const hasChosenPointRef = useRef(false);

  useEffect(() => {
    if (pickTarget) {
      // Scroll to the MapComponent so that the location can be clicked without user scrolling..
      if (mapComponentRef.current) {
        const rect = mapComponentRef.current.getBoundingClientRect();
        const offsetY = rect.top;
        window.scrollBy(0, offsetY);
        hasChosenPointRef.current = true;
      }
    } else {
      if (controlsCardRef.current && hasChosenPointRef.current) {
        const rect = controlsCardRef.current.getBoundingClientRect();
        const offsetY = rect.top;
        window.scrollBy(0, offsetY);
      }
    }
  }, [pickTarget]);

  const computeRisk = useCallback(async () => {
    if (!canCompute || !requestPayload) {
      return;
    }

    try {
      setActiveStatus("loading", null);
      hasInteractedRef.current = true;

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
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      var routeData = data.mapbox_data?.routes?.[0]?.geometry ?? null;
      const endpoints = extractEndpointsFromDirections(routeData);

      // Persist results on the active route
      setActiveResult({
        modelInputs: data.model_inputs ?? null,
        prediction: data.prediction ?? null,
        status: "done",
      });

      updateActive({
        routeData: routeData,
        ...(endpoints ? { origin: endpoints.origin, destination: endpoints.destination } : {}),
      })

      // Immediately create a new route and switch to it.
      addRoute();
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      setActiveStatus("error", String(error));
      console.error("Error calling prediction model:", error);
    }
  }, [canCompute, requestPayload, setActiveResult, setActiveStatus, updateActive, addRoute]);

  const cancelCompute = useCallback(() => {
    abortRef.current?.abort();
    setActiveStatus("idle", null);
  }, [setActiveStatus]);

  const selectActiveInfoSection = (section) => {
    setActiveInfoSection(prev => (prev === section ? '' : section));
  }

  // Helper to scroll with a fixed-header offset
  const scrollResultsIntoView = useCallback(() => {
    if (mapComponentRef.current) {
      const rect = mapComponentRef.current.getBoundingClientRect();
      const offsetY = rect.top;
      window.scrollBy(0, offsetY);
    }

    return;
  }, []);

  // Detect “a new completed result exists”
  const { routes } = useRoutes();
  const completedCount = useMemo(
    () => routes.filter(r => r?.status === "done" && r?.prediction != null && r?.modelInputs).length,
    [routes]
  );

  const prevCompletedRef = useRef(0);
  useEffect(() => {
    if (completedCount > prevCompletedRef.current) {
      // Wait for DOM paint so the ResultsCard actually mounts before we scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollResultsIntoView();
        });
      });
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount, scrollResultsIntoView]);

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
                  ref={controlsCardRef}
                  pickTarget={pickTarget}
                  onStartPick={setPickTarget}
                  onComputeRisk={computeRisk}
                  canCompute={canCompute}
                  isComputing={isComputing}
                  onCancelCompute={cancelCompute}
                />
              </Col>
              {/* Map in right column */}
              <Col xs={12} md={8}>
                <MapComponent
                  ref={mapComponentRef}
                  pickTarget={pickTarget}
                  onCancelPick={() => setPickTarget(null)}
                  hasInteracted={hasInteractedRef.current}
                />
              </Col>
              <Col xs={12} md={12}>
                <ResultsCard ref={resultsCardRef} />
              </Col>
            </Row>
          </>
        }
      </Container>
    </>
  );
}

function App() {
  return (
    <RoutesProvider>
      <AppInner />
    </RoutesProvider>
  );
}

export default App;
