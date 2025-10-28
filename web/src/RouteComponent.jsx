import { useEffect, useState } from "react";
import { Layer, Marker, Source} from 'react-map-gl/mapbox';

export default function RouteComponent(props) {

  const [originLat, setOriginLat] = useState(null);
  const [originLng, setOriginLng] = useState(null);
  const [destinationLat, setDestinationLat] = useState(null);
  const [destinationLng, setDestinationLng] = useState(null);

  const [routeData, setRouteData] = useState(null);
// eslint-disable-next-line
  const [modelInputs, setModelInputs] = useState(null);
// eslint-disable-next-line
  const [prediction, setPrediction] = useState(null);

  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);

  if (props?.originLat !== originLat) {
    setOriginLat(props?.originLat);
  }
  if (props?.originLng !== originLng) {
    setOriginLng(props?.originLng);
  }
    if (props?.destinationLat !== destinationLat) {
    setDestinationLat(props?.destinationLat);
  }
  if (props?.destinationLng !== destinationLng) {
    setDestinationLng(props?.destinationLng);
  }
  var setIsDataLoading = props.setIsDataLoading;

  useEffect(() => {
    if (!originLat || !originLng) {
      setOriginMarker(null);
      setModelInputs(null);
      setRouteData(null);
      setPrediction(null);
    } else {
      setOriginMarker(
        <Marker longitude={originLng} latitude={originLat} />
      )
    }
  }, [originLat, originLng]);

  useEffect(() => {
    if (!destinationLat || !destinationLng) {
      setDestinationMarker(null);
      setModelInputs(null);
      setRouteData(null);
      setPrediction(null);
    } else {
      setDestinationMarker(
        <Marker longitude={destinationLng} latitude={destinationLat} />
      )
    }
  }, [destinationLat, destinationLng]);

  useEffect(() => {
    async function fetchData() {
      if(!originLat || !originLng || !destinationLat || !destinationLng) {
        return;
      }

      // Before starting the fetch, invalidate the route data.
      // This keeps the old route from appearing while the query runs.
      setRouteData(null);

      // Get current time in ISO format to pass to the ML model.
      const isoCurrentTime = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000))
                      .toISOString()
                      .slice(0, 19);

      const formattedData = {
        "o_lat": originLat,
        "o_lng": originLng,
        "d_lat": destinationLat,
        "d_lng": destinationLng,
        "date_str": isoCurrentTime
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
  }, [originLat, originLng, destinationLat, destinationLng, setIsDataLoading]);

  const lineStyle: LineLayer = {
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
