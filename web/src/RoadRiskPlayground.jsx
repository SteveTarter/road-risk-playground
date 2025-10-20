import React from "react";
import { Container, Card } from "react-bootstrap";

// Read from environment; fallback to an empty string
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || "";
if (!API_BASE_URL) {
  console.warn("API_BASE_URL is not defined in the environment");
}

export default function RoadRiskPlayground() {

  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">Road Risk Playground</h1>

      <Card className="mb-4">
        <Card.Body>
          <Card.Text>
            This app assesses the risk of an accident on a route chosen by a user on a map.  The risk is assessed using an AI model trained on data from the Kaggle Playground competition.  This app is currently under construction--this is the skeleton.
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
}
