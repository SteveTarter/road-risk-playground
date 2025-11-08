import React, { useCallback, useEffect, useState } from "react";
import { Card, Form, Button, InputGroup } from "react-bootstrap";
import { SearchBox } from "@mapbox/search-js-react";
import DateTime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import { useRoutes } from "./Context/RoutesContext"

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
  pickTarget,
  onStartPick,
  onCancelPick,
  onComputeRisk,
  canCompute,
  isComputing,
  onCancelCompute,
}) {
  // Route state from context
  const {active, updateActive } = useRoutes();
  const origin = active?.origin || null;
  const destination = active?.destination || null;
  const travelDateTimeText = active?.travelDateTimeText || "";

  // Local text for the visible inputs (controlled UI)
  const [originText, setOriginText] = useState(origin?.label || "");
  const [destText, setDestText] = useState(destination?.label || "");
  const [initialViewDate, setInitialViewDate] = useState(null);

  const isPickingOrigin = pickTarget === 'origin';
  const isPickingDest = pickTarget === 'destination';

  // Simple label helper
  const pickLabel = (active) => (active ? 'Click a point…' : 'Pick on map');

  // One-time init of DateTime's initial view when we first get a value
  useEffect(() => {
    if (initialViewDate || !travelDateTimeText) {
      return;
    }
    setInitialViewDate(new Date(travelDateTimeText));
  }, [travelDateTimeText, initialViewDate]);

  // When SearchBox returns a full feature (enter or click)
  const applySelection = useCallback((payload, fieldKey, textSetter) => {
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
      Promise.resolve().then(() => {
        if (el && typeof el.blur === "function") el.blur();
      });
    }

    // Update visible text AFTER blur (another microtask), then commit coords
    Promise.resolve().then(() => {
      textSetter?.(label || "");
      updateActive({ [fieldKey]: { lat, lng, label } });
    });
  }, [updateActive]);

  useEffect(() => {
    const next = origin?.label || "";
    setOriginText((prev) => (prev === next ? prev : next));
  }, [origin?.label]);

  useEffect(() => {
    const next = destination?.label || "";
    setDestText((prev) => (prev === next ? prev : next));
  }, [destination?.label]);

  const handleOriginRetrieve = useCallback((res) =>
    applySelection(res, "origin", setOriginText),
    [applySelection]
  );

  const handleOriginSelect = handleOriginRetrieve;

  const handleDestRetrieve = useCallback((res) =>
      applySelection(res, "destination", setDestText),
    [applySelection]
  );
  const handleDestSelect = handleDestRetrieve;

  const clearOrigin = () => {
    updateActive({ origin: null });
    setOriginText("");
  };
  const clearDestination = () => {
    updateActive({ destination: null });
    setDestText("");
  };

  // Normalize picker value to local ISO "YYYY-MM-DD HH:mm"
  const handleDateTimeChange = (res) => {
    const dt = res?._d instanceof Date ? res._d : (res instanceof Date ? res : null);
    if (!dt) {
      return;
    }
    const ms = dt.getTime() - dt.getTimezoneOffset() * 60000;
    var localIso = new Date(ms).toISOString().slice(0,16); // YYYY-MM-DDTHH:mm
    localIso = localIso.slice(0,10) + ' ' + localIso.slice(11,16); // YYYY-MM-DD HH:mm
    updateActive({ travelDateTimeText: localIso})
    setInitialViewDate(dt);
  };

  const showDateTimeChooser = true;

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
              onChange={(v) => setOriginText(typeof v === "string" ? v : (v?.target?.value ?? ""))}
              onRetrieve={handleOriginRetrieve}
              onSelect={handleOriginSelect}
              placeholder="Origin address"
              options={SEARCH_OPTS}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            />
            <Button
              variant={isPickingOrigin ? "primary" : "outline-primary"}
              onClick={() => onStartPick(isPickingOrigin ? null : 'origin')}
              className="ms-2"
            >
              {pickLabel(isPickingOrigin)}
            </Button>
            <Button variant="outline-secondary" onClick={clearOrigin} disabled={!origin}>
              Clear
            </Button>
          </InputGroup>

          <Form.Label className="mt-3 mb-1">Destination</Form.Label>
          <InputGroup className="mb-2">
            <SearchBox
              accessToken={MAPBOX_TOKEN}
              value={destText}
              onChange={(v) => setDestText(typeof v === "string" ? v : (v?.target?.value ?? ""))}
              onRetrieve={handleDestRetrieve}
              onSelect={handleDestSelect}
              placeholder="Destination address"
              options={SEARCH_OPTS}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            />
            <Button
              variant={isPickingDest ? "primary" : "outline-primary"}
              onClick={() => onStartPick(isPickingDest ? null : 'destination')}
              className="ms-2"
            >
              {pickLabel(isPickingDest)}
            </Button>
            <Button variant="outline-secondary" onClick={clearDestination} disabled={!destination}>
              Clear
            </Button>
          </InputGroup>

          { showDateTimeChooser && initialViewDate &&
            <div className="form-group">
              <label htmlFor="dateTimePicker">Date and Time:</label>
              <DateTime
                onChange={handleDateTimeChange}
                initialViewDate={initialViewDate}
                inputProps={{ placeholder: travelDateTimeText }}
                dateFormat="YYYY-MM-DD"
                timeFormat="HH:mm"
              />
            </div>
          }
          <div className="d-flex gap-2 mt-3">
            <Button
              variant="primary"
              onClick={onComputeRisk}
              disabled={!canCompute || isComputing}
            >
              {isComputing ? "Computing…" : "Compute Risk"}
            </Button>
            {isComputing && (
              <Button variant="outline-secondary" onClick={onCancelCompute}>
                Cancel
              </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
