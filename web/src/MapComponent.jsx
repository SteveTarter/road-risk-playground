import Map from "react-map-gl/mapbox";
import { useCallback, useEffect, useRef, useState } from "react";
import { SpinnerLoading } from "./Utils/SpinnerLoading"
import { Container, Card } from "react-bootstrap";
import GeocoderControl from "./GeocoderControl"
import "./MapComponent.css"

export default function MapComponent({ onSelect }) {
  // eslint-disable-next-line
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [originLat, setOriginLat] = useState(null);
  const [originLng, setOriginLng] = useState(null);
  const [destinationLat, setDestinationLat] = useState(null);
  const [destinationLng, setDestinationLng] = useState(null);

  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

  // Map styles
  const MAP_STYLE_STREET = "mapbox://styles/mapbox/standard";
  const mapStyle = MAP_STYLE_STREET;

  const onClick = useCallback((event) => {
    console.log("onClick()");
    console.log("@ (%d, %d)", event.point.x, event.point.y);
  }, []);

  const onLoad = useCallback(() => {
    setIsDataLoaded(true);
    setIsTransitioning(false);
  }, []);

  const onZoom = useCallback((viewState) => {
    // eslint-disable-next-line
    const currentZoom = viewState.zoom;
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) {
      return;
    }

    if (originLat && originLng && destinationLat && destinationLng) {
      var xMin = originLat < destinationLat ? originLat : destinationLat;
      var xMax = originLat > destinationLat ? originLat : destinationLat;
      var yMin = originLng < destinationLng ? originLng : destinationLng;
      var yMax = originLng > destinationLng ? originLng : destinationLng;

      map.fitBounds([
        [yMin, xMin],
        [yMax, xMax]
      ],
      {
        padding: {top: 35, bottom:35, left: 35, right: 35}
      })
    }
    else if (originLat && originLng) {
      map.fitBounds([
        [originLng, originLat],
        [originLng, originLat]
      ],
      {
        padding: {top: 35, bottom:35, left: 35, right: 35}
      })
      map.flyTo({
        center: [originLng, originLat],
        zoom: 15
      })
    }
    else if (destinationLat && destinationLng) {
      map.fitBounds([
        [destinationLng, destinationLat],
        [destinationLng, destinationLat]
      ],
      {
        padding: {top: 35, bottom:35, left: 35, right: 35}
      })
      map.flyTo({
        center: [destinationLng, destinationLat],
        zoom: 15
      })
    }
  }, [mapRef, originLat, originLng, destinationLat, destinationLng]);

  const handleOriginPick = useCallback(({ lng, lat, result }) => {
    console.log('Picked Origin:', { lng, lat, place: result?.place_name });
    setOriginLat(lat);
    setOriginLng(lng);
  }, [setOriginLat, setOriginLng]);

  const handleOriginClear = useCallback(() => {
    console.log('Cleared Origin');
    setOriginLat(null);
    setOriginLng(null);
  }, [setOriginLat, setOriginLng]);

  const handleDestinationPick = useCallback(({ lng, lat, result }) => {
    console.log('Picked Destination:', { lng, lat, place: result?.place_name });
    setDestinationLat(lat);
    setDestinationLng(lng);
  }, [setDestinationLat, setDestinationLng]);

  const handleDestinationClear = useCallback(() => {
    console.log('Cleared Destination');
    setDestinationLat(null);
    setDestinationLng(null);
  }, [setDestinationLat, setDestinationLng]);

  const handleOriginLoading = useCallback(() => {
    console.log('OnLoading');
  }, []);

  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">Map</h1>

      <Card className="mb-4 map-wrapper">
        <Card.Body>
          <div ref={containerRef} className="map-viewport">
            <Map
              id="map"
              ref={mapRef}
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
                  <GeocoderControl
                    mapboxAccessToken={mapboxToken}
                    placeholder="Origin"
                    position="top-left"
                    onPick={handleOriginPick}
                    onClear={handleOriginClear}
                    onLoading={handleOriginLoading}
                  />
                  <GeocoderControl
                    mapboxAccessToken={mapboxToken}
                    placeholder="Destination"
                    position="top-left"
                    onPick={handleDestinationPick}
                    onClear={handleDestinationClear}
                    center={[destinationLng, destinationLat]}
                  />
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