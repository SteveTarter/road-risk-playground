import { useEffect, useState } from "react";
import { Layer, Marker, Source} from 'react-map-gl/mapbox';

export default function RouteComponent({
  origin,
  destination,
  routeData,
  color,
  mapComponentRef,
  setBounds
}) {

  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);

  useEffect(() => {
    if (!origin) {
      setBounds(null);
      setOriginMarker(null);
    } else {
      setOriginMarker(
        <Marker
          color={color}
          longitude={origin.lng}
          latitude={origin.lat}
        />
      )
    }
  }, [origin, color, setBounds]);

  useEffect(() => {
    if (!destination) {
      setBounds(null);
      setDestinationMarker(null);
    } else {
      setDestinationMarker(
        <Marker
        color={color}
          longitude={destination.lng}
          latitude={destination.lat}
        />
      )
    }
  }, [destination, color, setBounds]);

  useEffect(() => {
    if(!origin || !destination) {
      return;
    }

    if(!routeData) {
      var minLat = origin.lat < destination.lat ? origin.lat : destination.lat;
      var maxLat = origin.lat > destination.lat ? origin.lat : destination.lat;
      var minLon = origin.lng < destination.lng ? origin.lng : destination.lng;
      var maxLon = origin.lng > destination.lng ? origin.lng : destination.lng;
      var bounds = [
        [minLon, minLat],
        [maxLon, maxLat]
      ];
      setBounds(bounds);

      mapComponentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start'});
    }
    else {

      // Calculate the bounds of this route based on the points on the route.
      minLat = Infinity;
      maxLat = -Infinity;
      minLon = Infinity;
      maxLon = -Infinity;

      for (const coordinate of routeData.coordinates) {
        const [lon, lat] = coordinate;
        minLon = Math.min(minLon, lon);
        minLat = Math.min(minLat, lat);
        maxLon = Math.max(maxLon, lon);
        maxLat = Math.max(maxLat, lat);
      }
      bounds = [
        [minLon, minLat],
        [maxLon, maxLat]
      ];
      setBounds(bounds);

      mapComponentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start'});
    }
  }, [origin, destination, routeData, mapComponentRef, setBounds]);

  const lineStyle = {
    id: 'line',
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-width': 3,
      'line-color': color,
    }
  };

  return (
    <>
      {originMarker}
      {destinationMarker}
      {routeData &&
        <Source type="geojson" data={routeData}>
          <Layer {...lineStyle} />
        </Source>
      }
    </>
  )
}
