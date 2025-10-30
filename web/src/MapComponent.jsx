import Map from "react-map-gl/mapbox";
import { useCallback, useEffect, useRef, useState } from "react";
import { SpinnerLoading } from "./Utils/SpinnerLoading"
import { Card } from "react-bootstrap";
import RouteComponent from "./RouteComponent";
import "./MapComponent.css"

export default function MapComponent({ origin, destination, travelDateTime }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const [isDataLoading, setIsDataLoading] = useState(false);

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

    if (origin && destination) {
      var xMin = origin.lat < destination.lat ? origin.lat : destination.lat;
      var xMax = origin.lat > destination.lat ? origin.lat : destination.lat;
      var yMin = origin.lng < destination.lng ? origin.lng : destination.lng;
      var yMax = origin.lng > destination.lng ? origin.lng : destination.lng;

      map.fitBounds([
        [yMin, xMin],
        [yMax, xMax]
      ],
      {
        padding: {top: 35, bottom:35, left: 35, right: 35}
      })
    }
    else if (origin) {
       map.flyTo({
        center: [origin.lng, origin.lat],
        zoom: 15
      })
    }
    else if (destination) {
      map.flyTo({
        center: [destination.lng, destination.lat],
        zoom: 15
      })
    }
  }, [mapRef, origin, destination]);

  return (
    <Card className="mb-3 map-card">
      <Card.Header as="h6">
        Map
        {travelDateTime ? (
          <span className="text-muted ms-2" style={{ fontSize: "0.85em" }}>
            {travelDateTime}&nbsp;·&nbsp;
          </span>
        ) : 'Time not set · '
        }
        <small className="text-muted">
          {origin ? "Origin set" : "Origin not set"} · {destination ? "Destination set" : "Destination not set"}
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
            <RouteComponent
              origin={origin}
              destination={destination}
              travelDateTime={travelDateTime}
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