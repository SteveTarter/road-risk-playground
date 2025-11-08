import { useMemo } from "react";
import { Layer, Marker, Source} from 'react-map-gl/mapbox';

export default function RouteComponent({
  id,
  origin,
  destination,
  routeData,
  color,
  isDimmed
}) {

  // Normalize routeData into GeoJSON Feature<LineString>
  const lineFeature = useMemo(() => {
    if (!routeData) return null;

    // If it's already a GeoJSON Feature
    if (routeData.type === "Feature" && routeData.geometry?.type === "LineString") {
      return routeData;
    }

    // If it's a bare GeoJSON geometry
    if (routeData.type === "LineString" && Array.isArray(routeData.coordinates)) {
      return { type: "Feature", geometry: routeData, properties: {} };
    }

    // If your API returns { coordinates: [...] } (Mapbox Directions geometry when using "geojson" option)
    if (Array.isArray(routeData.coordinates)) {
      return {
        type: "Feature",
        geometry: { type: "LineString", coordinates: routeData.coordinates },
        properties: {},
      };
    }

    return null;
  }, [routeData]);

  // Give each route unique source/layer IDs
  const sourceId = `route-src-${id}`;
  const layerId  = `route-line-${id}`;

  return (
    <>
      {lineFeature && (
        <Source id={sourceId} type="geojson" data={lineFeature}>
          <Layer
            id={layerId}
            type="line"
            paint={{
              "line-color": color,
              "line-width": 4,
              "line-opacity": isDimmed ? 0.35 : 0.9,
            }}
          />
        </Source>
      )}

      {/* Optional: show markers for this route too (color-coded) */}
      {origin && (
        <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom">
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: color, border: "2px solid white", boxShadow: "0 0 2px rgba(0,0,0,0.5)"
          }}/>
        </Marker>
      )}
      {destination && (
        <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: color, border: "2px solid white", boxShadow: "0 0 2px rgba(0,0,0,0.5)"
          }}/>
        </Marker>
      )}
    </>
  );
}
