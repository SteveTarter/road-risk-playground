import Map from "react-map-gl/mapbox";
import { useCallback, useEffect, useRef, useState } from "react";
import { SpinnerLoading } from "./Utils/SpinnerLoading"
import { Card } from "react-bootstrap";
import GeocoderControl from "./GeocoderControl"
import "./MapComponent.css"
import RouteComponent from "./RouteComponent";

export default function MapComponent({ onSelect }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const [isDataLoading, setIsDataLoading] = useState(false);

  const [originLat, setOriginLat] = useState(null);
  const [originLng, setOriginLng] = useState(null);
  const [destinationLat, setDestinationLat] = useState(null);
  const [destinationLng, setDestinationLng] = useState(null);

  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

  const MAP_STYLE_STREET = "mapbox://styles/mapbox/standard";
  const mapStyle = MAP_STYLE_STREET;

  const onLoad = useCallback(() => {
    setIsDataLoading(false);
  }, []);

  const onZoom = useCallback((viewState) => {
    // eslint-disable-next-line
    const currentZoom = viewState.zoom;
  }, []);

  // Keep map sized to its card when the card resizes
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !containerRef.current) {
      return;
    }

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(containerRef.current);

    return () => ro.disconnect();
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
       map.flyTo({
        center: [originLng, originLat],
        zoom: 15
      })
    }
    else if (destinationLat && destinationLng) {
      map.flyTo({
        center: [destinationLng, destinationLat],
        zoom: 15
      })
    }
  }, [mapRef, originLat, originLng, destinationLat, destinationLng]);

  const handleOriginPick = useCallback(({ lng, lat }) => {
    setOriginLat(lat);
    setOriginLng(lng);
  }, [setOriginLat, setOriginLng]);

  const handleOriginClear = useCallback(() => {
    setOriginLat(null);
    setOriginLng(null);
  }, [setOriginLat, setOriginLng]);

  const handleDestinationPick = useCallback(({ lng, lat }) => {
    setDestinationLat(lat);
    setDestinationLng(lng);
  }, [setDestinationLat, setDestinationLng]);

  const handleDestinationClear = useCallback(() => {
    setDestinationLat(null);
    setDestinationLng(null);
  }, [setDestinationLat, setDestinationLng]);

  return (
    <Card className="mb-3 map-card">
      <Card.Header as="h6" className="d-flex justify-content-between align-items-center">
        <span>Map</span>
        <small className="text-muted">
          {originLat && originLng ? "Origin set" : "Origin not set"} · {destinationLat && destinationLng ? "Destination set" : "Destination not set"}
        </small>
      </Card.Header>
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
            onZoom={onZoom}
            style={{ width: "100%", height: "100%" }}
          >
            {/* On small screens these stack; on md+ they sit on opposite corners */}
            <GeocoderControl
              mapboxAccessToken={mapboxToken}
              placeholder="Origin"
              position="top-left"
              onPick={handleOriginPick}
              onClear={handleOriginClear}
            />
            <GeocoderControl
              mapboxAccessToken={mapboxToken}
              placeholder="Destination"
              position="top-left"
              onPick={handleDestinationPick}
              onClear={handleDestinationClear}
              center={[destinationLng, destinationLat]}
            />
            <RouteComponent
              originLat={originLat}
              originLng={originLng}
              destinationLat={destinationLat}
              destinationLng={destinationLng}
              setIsDataLoading={setIsDataLoading}
            />
            {isDataLoading ?
              <div>
                <SpinnerLoading />
              </div>
              :
              <></>
            }
          </Map>
        </div>
      </Card.Body>
    </Card>
   )
}