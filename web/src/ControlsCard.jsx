import React, { useCallback, useState } from "react";
import { Card, Form, Button, InputGroup } from "react-bootstrap";
import { SearchBox } from "@mapbox/search-js-react";

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

function toPointFromFeature(feature) {
  const lng = feature.geometry.coordinates[0];
  const lat = feature.geometry.coordinates[1];
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return { lng, lat };
}

export default function ControlsCard({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  travelDateTime,
  onTravelDateTimeChange,
}) {
  // Local text for the visible inputs (controlled UI)
  const [originText, setOriginText] = useState(origin?.label || "");
  const [destText, setDestText] = useState(destination?.label || "");

  // When SearchBox returns a full feature (enter or click)
  const applySelection = useCallback((payload, setter, textSetter) => {
    const f = unwrapFeature(payload);
    if (!f) {
      return;
    }
    const pt = toPointFromFeature(f);
    const label = f?.place_name || f?.properties?.name || "";
    if (textSetter) {
      textSetter(label || "");
    }
    if (!pt) {
      return; // ignore invalid selections
    }

    setter({ ...pt, label });
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

          <Form.Label className="mt-3 mb-1">Date & Time of Travel</Form.Label>
          <Form.Control
            type="datetime-local"
            onChange={(e) => {
              // interpret as local time; store ISO string
              const v = e.target.value; // "YYYY-MM-DDTHH:mm"
              onTravelDateTimeChange(v);
            }}
          />
        </Form>

        <div className="small text-muted">
          {origin ? `Origin: ${origin.label}` : "Origin not set"} ·{" "}
          {destination ? `Destination: ${destination.label}` : "Destination not set"}
        </div>
      </Card.Body>
    </Card>
  );
}
