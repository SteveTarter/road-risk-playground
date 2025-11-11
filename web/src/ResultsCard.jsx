import React, { forwardRef } from "react";
import { Card, Table } from "react-bootstrap";
import { useRoutes } from "./Context/RoutesContext";

const isComplete = (r) =>
  r?.status === "done" && r?.prediction != null && r?.modelInputs;

function fmt(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }
  return value ?? "—";
}

// simple repeating palette; override per-route via r.meta?.color if you like
const COLORS = ["#1976d2", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2", "#00838f", "#5d4037"];
const pickColor = (i, r) => r?.meta?.color || COLORS[i % COLORS.length];

const ResultsCard = forwardRef(function ResultsCard(_props, ref) {
  const { routes } = useRoutes();

  const done = routes.filter(isComplete);
  if (done.length === 0) {
    return null;
  }

  // Show the card only if at least one route has either a prediction or inputs
  const anyData = routes?.some((r) => r?.prediction != null || r?.modelInputs != null);
  if (!anyData) {
    return null;
  }

  // Helper to safely read modelInputs fields
  const getMI = (r) => r?.modelInputs || {};

  const fieldRows = [
    ["Curvature",         (r) => getMI(r).curvature],
    ["Holiday",           (r) => getMI(r).holiday],
    ["Lighting",          (r) => getMI(r).lighting],
    ["Number of Lanes",   (r) => getMI(r).num_lanes],
    ["Public Road",       (r) => getMI(r).public_road],
    ["Road Signs Present",(r) => getMI(r).road_signs_present],
    ["Road Type",         (r) => getMI(r).road_type],
    ["School Season",     (r) => getMI(r).school_season],
    ["Speed Limit",       (r) => {
      const v = getMI(r).speed_limit;
      return typeof v === "number" ? Math.round(v) : v;
    }],
    ["Time of Day",       (r) => getMI(r).time_of_day],
    ["Weather",           (r) => getMI(r).weather],
  ];

  return (
    <div ref={ref} id="results-card">
      <Card className="mb-3">
        <Card.Body>
          <Card.Title as="h5" className="mb-3">Results</Card.Title>
          <Table size="sm" striped bordered hover responsive className="mb-0">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Feature</th>
                {done.map((r, i) => (
                  <th
                    key={r.id}
                    style={{ textAlign: "center" }}
                  >
                    Route {routes.indexOf(r) + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Risk row */}
              <tr>
                <th>Risk</th>
                {done.map((r, i) => (
                  <td key={r.id} style={{ textAlign: "center" }}>
                    {fmt(r.prediction)}
                  </td>
                ))}
              </tr>

              {/* Color row */}
              <tr>
                <th>Color</th>
                {done.map((r, i) => {
                  const c = pickColor(i, r);
                  return (
                    <td key={r.id} style={{ textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: c,
                          border: "1px solid rgba(0,0,0,0.25)",
                          verticalAlign: "middle"
                        }}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Derived input rows */}
              {fieldRows.map(([label, accessor]) => (
                <tr key={label}>
                  <th>{label}</th>
                  {done.map((r) => (
                    <td key={r.id} style={{ textAlign: "center" }}>{fmt(accessor(r))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
});

export default ResultsCard;
