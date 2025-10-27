import { useEffect, useState } from "react";
import { Marker} from 'react-map-gl/mapbox';

export default function RouteComponent(props) {

  const [originLat, setOriginLat] = useState(null);
  const [originLng, setOriginLng] = useState(null);
  const [destinationLat, setDestinationLat] = useState(null);
  const [destinationLng, setDestinationLng] = useState(null);

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

  useEffect(() => {
    if (!originLat || !originLng) {
      setOriginMarker(null);
    } else {
      setOriginMarker(
        <Marker longitude={originLng} latitude={originLat} />
      )
    }
  }, [originLat, originLng]);

  useEffect(() => {
    if (!destinationLat || !destinationLng) {
      setDestinationMarker(null);
    } else {
      setDestinationMarker(
        <Marker longitude={destinationLng} latitude={destinationLat} />
      )
    }
  }, [destinationLat, destinationLng]);

  return (
    <>
      {originMarker}
      {destinationMarker}
    </>
  )
}
