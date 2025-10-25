import Map, { useMap } from "react-map-gl/mapbox";
import { useCallback, useRef, useState } from "react";
import { SpinnerLoading } from "./Utils/SpinnerLoading"
import { Container, Card } from "react-bootstrap";
import GeocoderControl from "./GeocoderControl"
import "./MapComponent.css"

export default function MapComponent({ onSelect }) {
  // eslint-disable-next-line
  const { map } = useMap();
  const containerRef = useRef(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

  // Map styles
  const MAP_STYLE_STREET = "mapbox://styles/mapbox/standard";
  const mapStyle = MAP_STYLE_STREET;

  const onClick = useCallback((event) => {
    console.log("onClick()");
    console.log("@ (%d, %d)", event.point.x, event.point.y);
  }, []);

  const onLoad = useCallback(() => {
    setIsMapLoaded(true);
    setIsDataLoaded(true);
    setIsTransitioning(false);
    if(isMapLoaded) {
      console.log("Map loaded");
    }
  }, [isMapLoaded]);

  const onZoom = useCallback((viewState) => {
    // eslint-disable-next-line
    const currentZoom = viewState.zoom;
  }, []);


  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">Map</h1>

      <Card className="mb-4 map-wrapper">
        <Card.Body>
          <div ref={containerRef} className="map-viewport">
            <Map
              id="map"
              mapStyle={mapStyle}
              mapboxAccessToken={mapboxToken}
              onLoad={() => onLoad()}
              fog={{}}
              initialViewState={{
                longitude: -97.5,
                latitude: 32.75,
                zoom: 10,
              }}
              onClick={(event) => onClick(event)}
              onZoom={onZoom}
              style={{ width: "100%", height: "100%" }}   // critical: fill the viewport box
            >
              {(isDataLoaded && !isTransitioning) ?
                <>
                  <GeocoderControl mapboxAccessToken={mapboxToken} position="top-left" />
                </>
                :
                <div>
                  <SpinnerLoading />
                </div>
              }
            </Map>
          </div>
        </Card.Body>
      </Card>
    </Container>
   )
}