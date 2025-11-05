import React from "react";
import { Card } from "react-bootstrap";

export default function RoadRiskPlayground({ onShow }) {

  return (
    <Card className="mb-3">
      <Card.Body className="d-flex flex-column gap-2">
        <div>
          <Card.Title as="h5" className="mb-2">Road Risk Playground</Card.Title>
          <Card.Text className="mb-0">
            Explore a route and see a relative risk score based on derived features
            (curvature, class, lanes, lighting). Trained on synthetic data—results
            are illustrative only.
          </Card.Text>
        </div>
      </Card.Body>
    </Card>
  );
}
