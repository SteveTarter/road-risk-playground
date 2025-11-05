import { useEffect, useState } from "react";
import { Layer, Marker, Source} from 'react-map-gl/mapbox';

export default function RouteComponent({ origin, destination, travelDateTime, setIsDataLoading, setModelInputs, setPrediction, mapComponentRef, setBounds }) {

  const [routeData, setRouteData] = useState(null);

  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);

  useEffect(() => {
    if (!origin) {
      setBounds(null);
      setOriginMarker(null);
      setModelInputs(null);
      setRouteData(null);
      setPrediction(null);
    } else {
      setOriginMarker(
        <Marker longitude={origin.lng} latitude={origin.lat} />
      )
    }
  }, [origin, setModelInputs, setPrediction, setBounds]);

  useEffect(() => {
    if (!destination) {
      setBounds(null);
      setDestinationMarker(null);
      setModelInputs(null);
      setRouteData(null);
      setPrediction(null);
    } else {
      setDestinationMarker(
        <Marker longitude={destination.lng} latitude={destination.lat} />
      )
    }
  }, [destination, setModelInputs, setPrediction, setBounds]);

  useEffect(() => {
    async function fetchData() {
      if(!origin || !destination) {
        return;
      }

      // Before starting the fetch, invalidate the route data.
      // This keeps the old route from appearing while the query runs.
      setRouteData(null);

      // Calculate the bounds of this route based on the origin and destination.
      // This is calculated again once the route is returned, as some routes
      // may extend outside this initial box.
      var minLat = origin.lat < destination.lat ? origin.lat : destination.lat;
      var maxLat = origin.lat > destination.lat ? origin.lat : destination.lat;
      var minLon = origin.lng < destination.lng ? origin.lng : destination.lng;
      var maxLon = origin.lng > destination.lng ? origin.lng : destination.lng;
      var bounds = [
        [minLon, minLat],
        [maxLon, maxLat]
      ];
      setBounds(bounds);

      const formattedData = {
        "o_lat": origin.lat,
        "o_lng": origin.lng,
        "d_lat": destination.lat,
        "d_lng": destination.lng,
        "date_str": travelDateTime
      }

      setIsDataLoading(true);
      mapComponentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start'});
      const url = `${process.env.REACT_APP_API_BASE_URL}/drive-risk`;
      try {
        const response = await fetch(url, {
          method: 'post',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        var routeData = data.mapbox_data.routes[0].geometry
        setModelInputs(data.model_inputs);
        setPrediction(data.prediction);
        setRouteData(routeData);
      } catch (error) {
        console.error("Error calling prediction model:", error);
      }

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

      setIsDataLoading(false);
    }
    fetchData();
  }, [origin, destination, travelDateTime, setIsDataLoading, setModelInputs, setPrediction, mapComponentRef, setBounds]);

  const lineStyle = {
    id: 'line',
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-width': 2,
      'line-color': '#007cbf'
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
