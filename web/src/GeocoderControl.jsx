import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {useControl} from 'react-map-gl/mapbox';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

export default function GeocoderControl({
    mapboxAccessToken,
    position,
    onInit = () => {},
    onLoading = () => {},
    onResults = () => {},
    onResult = () => {},
    onError = () => {},
    onPick = () => {},
    onClear = () => {},
    ...geocoderOpts
}) {

  useControl(
    () => {
      const ctrl = new MapboxGeocoder({
        ...geocoderOpts,
        accessToken: mapboxAccessToken,
        marker: false,
        flyTo: false,
        mapboxgl: mapboxgl
      });

      ctrl.on('loading', onLoading);
      ctrl.on('results', onResults);
      ctrl.on('result', (evt) => {
        onResult(evt);

        const result = evt?.result;
        const location =
          result &&
          (result.center ||
            (result.geometry?.type === 'Point' && result.geometry.coordinates));

        if (location) {
                    // notify parent
          onPick({ lng: location[0], lat: location[1], result });
        }
      });
      ctrl.on('error', onError);
      ctrl.on('init', () => {
        onInit()
      })
      ctrl.on('clear', () => {
        onClear();
      })
      return ctrl;
    },
    {position}
  );

  return (
    <>
    </>
  )
}