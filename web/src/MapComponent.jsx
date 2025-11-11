import Map from "react-map-gl/mapbox";
import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { SpinnerLoading } from "./Utils/SpinnerLoading"
import { Card } from "react-bootstrap";
import RouteComponent from "./RouteComponent";
import { useRoutes } from "./Context/RoutesContext"
import "./MapComponent.css"

const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
const mapboxApiUrl = process.env.REACT_APP_MAPBOX_API_URL;
const DEFAULT_VIEW = { longitude: -73.977625, latitude: 40.76148, zoom: 10 };

async function reverseGeocodeSnap(lng, lat) {
  const url =
    `${mapboxApiUrl}/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?types=address,place&limit=1&access_token=${encodeURIComponent(mapboxToken)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Reverse geocode failed: ${res.status}`);
  }

  const data = await res.json();
  const f = data?.features?.[0];

  if (f) {
    const [slng, slat] =
      f.center ||
      (Array.isArray(f.geometry?.coordinates) ? f.geometry.coordinates : [lng, lat]);

    return { lng: slng, lat: slat, label: f.place_name || "", feature: f };
  }

  // fallback: keep the click
  return { lng, lat, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, feature: null };
}

// simple distinct-ish palette
const COLORS = ["#1976d2", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2", "#00838f", "#5d4037"];
const pickColor = (i) => COLORS[i % COLORS.length];

// union bounds of many [minX,minY,maxX,maxY]
function extendBBox(b, more) {
  if (!more) {
    return b;
  }

  if (!b) {
    return [...more];
  }

  b[0] = Math.min(b[0], more[0]);
  b[1] = Math.min(b[1], more[1]);
  b[2] = Math.max(b[2], more[2]);
  b[3] = Math.max(b[3], more[3]);

  return b;
}

const MapComponent = forwardRef(function MapComponent(props, ref) {
  const {
    pickTarget,           // "origin" | "destination" | null
    onCancelPick,         // () => void
    hasInteracted,        // has a prediction been made
  } = props;

  const { routes, active, updateActive } = useRoutes();

  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [debug, setDebug] = useState(null);

  // spinner if any active route is loading
  const isDataLoading = routes.some((r) => r.status === "loading");

  const MAP_STYLE_STREET = "mapbox://styles/mapbox/standard";
  const mapStyle = MAP_STYLE_STREET;


  const [viewState, setViewState] = useState(DEFAULT_VIEW);

  const mapComponentRef = useRef(null);
  // expose the DOM node to parent
  React.useImperativeHandle(ref, () => mapComponentRef.current, []);

  useEffect(() => {
    const dbg = (process.env.REACT_APP_DEBUG || "").toLowerCase() === "true";
    setDebug(dbg);
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
    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch("https://ipapi.co/json/");
        if (!resp.ok) {
          return;
        }

        const json = await resp.json();
        let lat = Number(json.latitude);
        let lng = Number(json.longitude);

        if (!cancelled && Number.isFinite(lat) && Number.isFinite(lng)) {
          setViewState(v => ({ ...v, longitude: lng, latitude: lat, zoom: 10 }));
        }
      }
      catch {
        /* ignore - keep DEFAULT_VIEW */
      }
    })();

    return () => { cancelled = true; }
  }, []);

  // compute an overall bbox across all routes (origins/dests + optional routeData bbox)
  const combinedBBox = useMemo(() => {
    let b = null;
    for (const r of routes) {
      if (r.origin) {
        b = extendBBox(b, [r.origin.lng, r.origin.lat, r.origin.lng, r.origin.lat]);
      }
      if (r.destination) {
        b = extendBBox(b, [r.destination.lng, r.destination.lat, r.destination.lng, r.destination.lat]);
      }
      // if r.routeData is available, include it:
      if (r.routeData) {
        // Calculate the bounds of this route based on the points on the route.
        var minLat = Infinity;
        var maxLat = -Infinity;
        var minLon = Infinity;
        var maxLon = -Infinity;

        for (const coordinate of r.routeData.coordinates) {
          const [lon, lat] = coordinate;
          minLon = Math.min(minLon, lon);
          minLat = Math.min(minLat, lat);
          maxLon = Math.max(maxLon, lon);
          maxLat = Math.max(maxLat, lat);
        }

        b = extendBBox(b, [minLon, minLat, maxLon, maxLat]);
      }
    }
    return b;
  }, [routes]);

  // fit to everything when routes change
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !combinedBBox) {
      return;
    }

    // If there are no routes, don't fit to bounds when first coordinate chosen.
    if (!hasInteracted && !(routes[0].origin && routes[0].destination)) {
      return;
    }

    map.fitBounds(
      [
        [combinedBBox[0], combinedBBox[1]],
        [combinedBBox[2], combinedBBox[3]],
      ],
      { padding: { top: 40, bottom: 40, left: 40, right: 40 } }
    );
  }, [combinedBBox, hasInteracted, routes]);

  useEffect(() => {
    const map = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map || !pickTarget) {
      return;
    }

    map.getCanvas().style.cursor = "crosshair";

    const handleClick = async (e) => {
      try {
        const { lng, lat } = e.lngLat;
        const snapped = await reverseGeocodeSnap(lng, lat);

        if (pickTarget === "origin") {
          updateActive({ origin: snapped });
        } else if (pickTarget === "destination") {
          updateActive({ destination: snapped });
        }
      } catch (err) {
        console.error(err);
      } finally {
        // always exit pick mode after one selection
        onCancelPick?.();
        map.getCanvas().style.cursor = "";
      }
    };

    map.on("click", handleClick);

    // Esc to cancel
    const handleKey = (ev) => {
      if (ev.key === "Escape") {
        onCancelPick?.();
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      map.getCanvas().style.cursor = "";
      map.off("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [pickTarget, updateActive, onCancelPick]);

  return (
    <div ref={mapComponentRef}>
      <Card className="mb-3 map-card">
        <Card.Header as="h6">
          Map
          {debug &&
            <>
              <small className="text-muted">
                <span>&nbsp;·&nbsp;Debug Mode&nbsp;·&nbsp;</span>
                {active?.travelDateTimeText ?
                  `${active.travelDateTimeText} · `: "Time not set · "
                }
                {(active?.origin ? "Origin set" : "Origin not set")} · {(active?.destination ? "Destination set" : "Destination not set")}
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
              fog={{}}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              initialViewState={DEFAULT_VIEW}
              style={{ width: "100%", height: "100%" }}
            >
            {/* Render ALL routes */}
            {routes.map((r, i) => (
              <RouteComponent
                id={r.id}
                key={r.id}
                origin={r.origin}
                destination={r.destination}
                routeData={r.routeData }
                color={pickColor(i)}
              />
            ))}
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
});

export default MapComponent;