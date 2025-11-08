import Map from "react-map-gl/mapbox";
import { useEffect, useMemo, useRef, useState } from "react";
import { SpinnerLoading } from "./Utils/SpinnerLoading"
import { Card } from "react-bootstrap";
import RouteComponent from "./RouteComponent";
import { useRoutes } from "./Context/RoutesContext"
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

export default function MapComponent({
  color,
  origin,
  destination,
  routeData,
  onOriginChange,
  onDestinationChange,
  travelDateTime,
  pickTarget,           // "origin" | "destination" | null
  onCancelPick,         // () => void
  status
}) {
  const { routes, activeIndex, active, updateActive } = useRoutes();

  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [debug, setDebug] = useState(null);

  // spinner if any active route is loading
  const isDataLoading = routes.some((r) => r.status === "loading");


  const MAP_STYLE_STREET = "mapbox://styles/mapbox/standard";
  const mapStyle = MAP_STYLE_STREET;

  const mapComponentRef = useRef(null);

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
      // if you store a route geojson bbox on r.routeData?.bbox = [minX,minY,maxX,maxY], include it:
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

    map.fitBounds(
      [
        [combinedBBox[0], combinedBBox[1]],
        [combinedBBox[2], combinedBBox[3]],
      ],
      { padding: { top: 40, bottom: 40, left: 40, right: 40 } }
    );
  }, [combinedBBox]);

  useEffect(() => {
    const map = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map || !pickTarget) {
      return;
    }

    map.getCanvas().style.cursor = "crosshair";

    const handleClick = async (e) => {
      try {
        const { lng, lat } = e.lngLat;
        const label = await reverseGeocode(lng, lat);
        const point = { lng, lat, label };

        if (pickTarget === "origin") {
          updateActive({ origin: point });
        } else if (pickTarget === "destination") {
          updateActive({ destination: point });
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
              initialViewState={{
                longitude: -97.5,
                latitude: 32.75,
                zoom: 10,
              }}
              style={{ width: "100%", height: "100%" }}
            >
            {/* Render ALL routes; active route is highlighted */}
            {routes.map((r, i) => (
              <RouteComponent
                id={r.id}
                key={r.id}
                origin={r.origin}
                destination={r.destination}
                routeData={r.routeData }
                color={pickColor(i)}
                isDimmed={i !== activeIndex}    // let RouteComponent reduce opacity when not active
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
}