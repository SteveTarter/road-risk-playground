import React, { useCallback, useEffect, useState } from "react";
import { Card, Form, Button, InputGroup } from "react-bootstrap";
import { SearchBox } from "@mapbox/search-js-react";
import DateTime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

const MAPBOX_TOKEN =
  process.env.REACT_APP_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;

const SEARCH_OPTS = { country: "us", types: "address,place" };

function unwrapFeature(payload) {
  // Accept: feature | {feature} | {features:[...]} | null
  if (!payload) {
    return null;
  }
  if (payload.type === "Feature" || Array.isArray(payload.geometry?.coordinates)) {
    return payload;
  }
  if (payload.feature) {
    return payload.feature;
  }
  if (Array.isArray(payload.features) && payload.features[0]) {
    return payload.features[0];
  }
  return null;
}

export default function ControlsCard({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  travelDateTimeText,
  setTravelDateTimeText,
}) {
  // Local text for the visible inputs (controlled UI)
  const [originText, setOriginText] = useState(origin?.label || "");
  const [destText, setDestText] = useState(destination?.label || "");
  const [initialViewDate, setInitialViewDate] = useState(null);

  useEffect((res) => {
    if (!res || !res._d) {
      return;
    }

    const newDateTime = new Date(res._d);
    const newDateTimeStr = newDateTime.toISOString().slice(0,19)
    console.log("newDateTimeStr", newDateTimeStr);
    setTravelDateTimeText(newDateTimeStr);
    if (!travelDateTimeText) {
      return;
    }

    if (initialViewDate) {
      return;
    }

    console.log("Converting travelDateTimeText: ", travelDateTimeText);
    const newDt = new Date(travelDateTimeText);
    setInitialViewDate(newDt);
  },[travelDateTimeText, initialViewDate, setInitialViewDate, setTravelDateTimeText]);

  // When SearchBox returns a full feature (enter or click)
  const applySelection = useCallback((payload, setter, textSetter) => {
    const feature = unwrapFeature(payload);
    if (!feature) {
      return;
    }

    const lat = feature.geometry.coordinates[1];
    const lng = feature.geometry.coordinates[0];
    const label = feature?.place_name || feature?.properties?.name || "";

    // Blur immediately to avoid focused descendant inside aria-hidden container
    // (SearchBox closes the results by toggling aria-hidden on it)
    if (typeof window !== "undefined") {
      const el = document.activeElement;
      // microtask: let SearchBox handle its own selection first
      Promise.resolve().then(() => {
        if (el && typeof el.blur === "function") el.blur();
      });
    }

    // Update visible text AFTER blur (another microtask), then commit coords
    Promise.resolve().then(() => {
      textSetter?.(label || "");
      setter({ lng, lat, label });
    });
  }, []);

  const handleOriginRetrieve = useCallback((res) =>
    applySelection(res, onOriginChange, setOriginText),
    [applySelection, onOriginChange]
  );

  const handleOriginSelect = useCallback((res) =>
    applySelection(res, onOriginChange, setOriginText),
    [applySelection, onOriginChange]
  );

  const handleDestRetrieve = useCallback((res) =>
      applySelection(res, onDestinationChange, setDestText),
    [applySelection, onDestinationChange]
  );
  const handleDestSelect = useCallback((res) =>
    applySelection(res, onDestinationChange, setDestText),
    [applySelection, onDestinationChange]
  );

  const clearOrigin = () => {
    onOriginChange(null);
    setOriginText("");
  };
  const clearDestination = () => {
    onDestinationChange(null);
    setDestText("");
  };

  const handleDateTimeChange = (res) => {
    console.log("dateTime", res._d);

    const newDateTime = new Date(res._d);
    const newDateTimeStr = newDateTime.toISOString().slice(0,19)
    console.log("newDateTimeStr", newDateTimeStr);
    setTravelDateTimeText(newDateTimeStr);
  };

  const showDateTimeChooser = false;

  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title as="h5" className="mb-3">Route Controls</Card.Title>

        {/* prevent Enter from submitting before selection commits */}
        <Form className="mb-3" onSubmit={(e) => e.preventDefault()}>
          <Form.Label className="mb-1">Origin</Form.Label>
          <InputGroup className="mb-2">
            <SearchBox
              accessToken={MAPBOX_TOKEN}
              value={originText}
              onChange={(v) =>
                setOriginText(
                  typeof v === "string" ? v : (v?.target?.value ?? "")
                )
              }
              onRetrieve={handleOriginRetrieve}
              onSelect={handleOriginSelect}
              placeholder="Origin address"
              options={SEARCH_OPTS}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            />
            <Button variant="outline-secondary" onClick={clearOrigin} disabled={!origin}>
              Clear
            </Button>
          </InputGroup>

          <Form.Label className="mt-3 mb-1">Destination</Form.Label>
          <InputGroup className="mb-2">
            <SearchBox
              accessToken={MAPBOX_TOKEN}
              value={destText}
              onChange={(v) =>
                setDestText(
                  typeof v === "string" ? v : (v?.target?.value ?? "")
                )
              }
              onRetrieve={handleDestRetrieve}
              onSelect={handleDestSelect}
              placeholder="Destination address"
              options={SEARCH_OPTS}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            />
            <Button variant="outline-secondary" onClick={clearDestination} disabled={!destination}>
              Clear
            </Button>
          </InputGroup>

          { showDateTimeChooser &&
            <div className="form-group">
              <label htmlFor="dateTimePicker">Select Date and Time:</label>
              <DateTime
                onChange={handleDateTimeChange}
                inputProps={{ placeholder: travelDateTimeText }}
                dateFormat="YYYY-MM-DD"
                timeFormat="HH:mm:ss"
              />
            </div>
          }
        </Form>
      </Card.Body>
    </Card>
  );
}
