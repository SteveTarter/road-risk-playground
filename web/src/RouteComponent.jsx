import { useEffect, useState } from "react";
import { Layer, Marker, Source} from 'react-map-gl/mapbox';

export default function RouteComponent({ origin, destination, travelDateTime, setIsDataLoading, setModelInputs, setPrediction }) {

  const [routeData, setRouteData] = useState(null);

  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);

  useEffect(() => {
    if (!origin) {
      setOriginMarker(null);
      setModelInputs(null);
      setRouteData(null);
      setPrediction(null);
    } else {
      setOriginMarker(
        <Marker longitude={origin.lng} latitude={origin.lat} />
      )
    }
  }, [origin, setModelInputs, setPrediction]);

  useEffect(() => {
    if (!destination) {
      setDestinationMarker(null);
      setModelInputs(null);
      setRouteData(null);
      setPrediction(null);
    } else {
      setDestinationMarker(
        <Marker longitude={destination.lng} latitude={destination.lat} />
      )
    }
  }, [destination, setModelInputs, setPrediction]);

  useEffect(() => {
    async function fetchData() {
      if(!origin || !destination) {
        return;
      }

      // Before starting the fetch, invalidate the route data.
      // This keeps the old route from appearing while the query runs.
      setRouteData(null);


      const formattedData = {
        "o_lat": origin.lat,
        "o_lng": origin.lng,
        "d_lat": destination.lat,
        "d_lng": destination.lng,
        "date_str": travelDateTime
      }

      setIsDataLoading(true);
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
        console.log("data: ", data);
        setModelInputs(data.model_inputs);
        setPrediction(data.prediction);
        setRouteData(data.mapbox_data.routes[0].geometry);
      } catch (error) {
        console.error("Error calling prediction model:", error);
      }

      console.log("Finished calling prediction model!!!!");
      setIsDataLoading(false);
    }
    fetchData();
  }, [origin, destination, travelDateTime, setIsDataLoading, setModelInputs, setPrediction]);

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
