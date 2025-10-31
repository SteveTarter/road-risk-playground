import React from "react";
import { Card } from "react-bootstrap";

// Read from environment; fallback to an empty string
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || "";
if (!API_BASE_URL) {
  console.warn("API_BASE_URL is not defined in the environment");
}

export default function RoadRiskPlayground() {

  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title as="h5" className="mb-3">Road Risk Playground</Card.Title>
        <Card.Text>
        This app assesses accident risk for a user-chosen route. It uses an ML model
        trained on a Kaggle Playground dataset. The data is synthetic, so the risk
        values returned are not accurate.
        </Card.Text>
      </Card.Body>
    </Card>
  );
}
