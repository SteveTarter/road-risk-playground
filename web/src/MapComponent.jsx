import Map from "react-map-gl/mapbox";
import { useCallback, useEffect, useRef, useState } from "react";
import { SpinnerLoading } from "./Utils/SpinnerLoading"
import { Card } from "react-bootstrap";
import RouteComponent from "./RouteComponent";
import "./MapComponent.css"

const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
const mapboxApiUrl = process.env.REACT_APP_MAPBOX_API_URL;

async function reverseGeocode(lng, lat) {
  const url =
    `${mapboxApiUrl}/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?types=address,place&limit=1&access_token=${encodeURIComponent(mapboxToken)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  const data = await res.json();
  const f = data?.features?.[0];
  return f?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function MapComponent({
  origin,
  destination,
  routeData,
  onOriginChange,
  onDestinationChange,
  travelDateTime,
  pickTarget,           // 'origin' | 'destination' | null
  onCancelPick,         // () => void
  status
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const [isDataLoading, setIsDataLoading] = useState(false);

  const [debug, setDebug] = useState(null);

  const [bounds, setBounds] = useState(null);

  const MAP_STYLE_STREET = "mapbox://styles/mapbox/standard";
  const mapStyle = MAP_STYLE_STREET;

  const mapComponentRef = useRef(null);

  const onLoad = useCallback(() => {
    const debugStr = process.env.REACT_APP_DEBUG.toLowerCase();
    setDebug(debugStr === "true");
  }, []);

  const onZoom = useCallback((viewState) => {
    // eslint-disable-next-line
    const currentZoom = viewState.zoom;
  }, []);

  useEffect(() => {
    if(!status) {
      return;
    }

    setIsDataLoading(status === "loading")
  }, [status, setIsDataLoading])

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

    if (origin && destination && bounds) {
      map.fitBounds(bounds,
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
  }, [mapRef, origin, destination, bounds]);

  useEffect(() => {
    const map = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map) {
      return;
    }

    if (!pickTarget) {
      return; // only attach while picking
    }
    map.getCanvas().style.cursor = 'crosshair';

    const handleClick = async (e) => {
      try {
        const { lng, lat } = e.lngLat;
        const label = await reverseGeocode(lng, lat);
        const point = { lng, lat, label };

        if (pickTarget === 'origin') {
          onOriginChange(point);
        } else if (pickTarget === 'destination') {
          onDestinationChange(point);
        }
      } catch (err) {
        console.error(err);
      } finally {
        // always exit pick mode after one selection
        onCancelPick?.();
      }
    };

    map.on('click', handleClick);

    // Esc to cancel
    const handleKey = (ev) => {
      if (ev.key === 'Escape') {
        onCancelPick?.();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      map.getCanvas().style.cursor = '';
      map.off('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [pickTarget, onOriginChange, onDestinationChange, onCancelPick]);

  return (
    <div ref={mapComponentRef}>
      <Card className="mb-3 map-card">
        <Card.Header as="h6">
          Map
          {debug &&
            <>
              <small className="text-muted">
                <span>&nbsp;·&nbsp;Debug Mode&nbsp;·&nbsp;</span>
                {travelDateTime ? (
                  <span>{travelDateTime}&nbsp;·&nbsp;</span>
                  ) : 'Time not set · '
                }
                {origin ? "Origin set" : "Origin not set"} · {destination ? "Destination set" : "Destination not set"}
            </small>
            </>
          }
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
                routeData={routeData}
                mapComponentRef={mapComponentRef}
                setBounds={setBounds}
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
    </div>
   )
}