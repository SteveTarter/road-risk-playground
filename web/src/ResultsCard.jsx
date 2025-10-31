import React from "react";
import { Card, Table } from "react-bootstrap";

function fmt(value) {
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }
  if (typeof value === "number") {
    return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }
  return value ?? "—";
}

export default function ResultsCard({
  modelInputs,
  prediction,
}) {

  if (!modelInputs) {
    return null;
  }

  const rows = [
    ["Curvature", modelInputs.curvature],
    ["Holiday", modelInputs.holiday],
    ["Lighting", modelInputs.lighting],
    ["Number of Lanes", modelInputs.num_lanes],
    ["Public Road", modelInputs.public_road],
    ["Road Signs Present", modelInputs.road_signs_present],
    ["Road Type", modelInputs.road_type],
    ["School Season", modelInputs.school_season],
    ["Speed Limit", modelInputs.speed_limit],
    ["Time of Day", modelInputs.time_of_day],
    ["Weather", modelInputs.weather],
  ];

  return (
    <>
      { prediction && modelInputs ?
        <Card className="mb-3">
          <Card.Body>
            <Card.Title as="h5" className="mb-3">Results</Card.Title>
            The risk of a crash was calculated to be {fmt(prediction)}<br/>
            The below data was derived from the route and current conditions.
            <Table size="sm" striped bordered hover responsive className="mb-0">
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label}>
                    <th style={{ width: "40%" }}>{label}</th>
                    <td>{fmt(value)}</td>
                 </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      :
        <></>
      }
    </>
  )
};
