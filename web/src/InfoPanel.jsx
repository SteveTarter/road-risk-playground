import React from "react";
import { Button, Card } from "react-bootstrap";

export default function InfoPanel({
  activeInfoSection,
  clearActiveInfoSection
}) {
  if (!activeInfoSection) return null;

  const SectionWrapper = ({ title, children }) => (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title as="h5">{title}</Card.Title>
        <div>{children}</div>
        <Button
          variant="primary"
          onClick={() => clearActiveInfoSection()}
          className="ms-2"
        >
          Return
        </Button>
      </Card.Body>
    </Card>
  );

  if (activeInfoSection === "directions") {
    return (
      <SectionWrapper title="Directions">
        <p className="mb-2">
          The model was trained on synthetic data; outputs are illustrative and
          should not be relied on for real-world risk decisions.
        </p>
        <ol className="mb-3">
          <li>
            Choose an <b>Origin</b> and <b>Destination</b> by either:
            <ul className="mt-2">
              <li>Typing an address into the Search boxes, or</li>
              <li>
                Clicking <i>Pick on map</i> and selecting a point on the map
                (the app reverse-geocodes and fills the address field).
              </li>
            </ul>
          </li>
          <li>
            Travel date/time defaults to the current time, but other date/times can be selected.
            Lighting conditions are derived from this timestamp and route location.
          </li>
          <li>
            Submit to generate the route, model inputs, and risk score. The
            route renders on the map; inputs and score appear in the results
            panel.
          </li>
        </ol>

        <h6>What the risk score means</h6>
        <p className="mb-2">
          The score ranges from <b>0.0</b> (lower relative risk) to <b>1.0</b>{" "}
          (higher relative risk) for the selected route and conditions. It is a
          comparative indicator, not an absolute probability.
        </p>

        <h6>Derived variables shown in the UI</h6>
        <ul className="mb-0">
          <li>
            <b>Curvature</b>: geometric curviness of the path segments.
          </li>
          <li>
            <b>Road class</b>: e.g., motorway/primary/secondary from Mapbox
            data.
          </li>
          <li>
            <b>Number of lanes</b>: estimated lane count along the route.
          </li>
          <li>
            <b>Urban / Rural</b>: urban context flag from street data.
          </li>
          <li>
            <b>Speed limit</b>: speed attributes where available.
          </li>
          <li>
            <b>Lighting</b>: day/night status from sun position at the selected
            time and place.
          </li>
          <li>
            <b>Weather / Holiday</b>: if provided, included as model inputs.
          </li>
        </ul>
        <p className="mt-2 mb-0">
          These values are listed in the results panel alongside the route’s
          risk score. Some values are aggregated across the route (e.g., typical
          class/lanes); others are computed from the timestamp and geometry
          (e.g., lighting).
        </p>
      </SectionWrapper>
    );
  }

  if (activeInfoSection === "about") {
    return (
      <SectionWrapper title="About">
        <p className="mb-2">
          This project explores route-based accident risk scoring using a model
          trained on <b>synthetic data</b>. Results are for demonstration only
          and should not be treated as ground truth.
        </p>
        <p className="mb-2">
          It was built in the context of the Kaggle Playground “Predicting Road
          Accident Risk” challenge, and a companion Stack Overflow deployment
          challenge. The app lets you select a route, derives features
          (curvature, class, lanes, urban context, lighting, etc.), and returns
          a relative risk score.
        </p>
        <h6 className="mb-2">Architecture (AWS + Mapbox)</h6>
        <ul className="mb-2">
          <li>
            <b>Frontend</b>: React + Mapbox GL JS (Search, map rendering,
            controls).
          </li>
          <li>
            <b>Routing & Geocoding</b>: Mapbox Directions and Geocoding APIs.
          </li>
          <li>
            <b>Backend</b>: AWS Lambda for feature extraction and scoring.
          </li>
          <li>
            <b>Model Hosting</b>: AWS (e.g., Lambda or SageMaker for inference).
          </li>
          <li>
            <b>Static hosting / CDN</b>: S3 + CloudFront (typical setup).
          </li>
          <li>
            <b>Infrastructure</b>: Terraform for repeatable provisioning.
          </li>
        </ul>
        <p className="mb-0">
          Source code:{" "}
          <a
            href="https://github.com/SteveTarter/road-risk-playground"
            target="_blank"
            rel="noreferrer"
          >
            github.com/SteveTarter/road-risk-playground
          </a>
        </p>
      </SectionWrapper>
    );
  }

  if (activeInfoSection === "legal") {
    return (
      <SectionWrapper title="Legal">
        <p className="mb-2">
          The underlying model was trained on <b>synthetic data</b>. Outputs are
          illustrative and not suitable for safety-critical use.
        </p>
        <p className="mb-2">
          <b>No Warranty</b>: Provided “as is” for educational/demo purposes.
          Accuracy, completeness, and availability are not guaranteed.
        </p>
        <p className="mb-2">
          <b>Limitation of Liability</b>: The author is not liable for any
          direct, indirect, incidental, special, consequential, or exemplary
          damages arising from use or inability to use this software.
        </p>
        <p className="mb-2">
          <b>Third-Party Services</b>: This application calls third-party APIs
          (e.g., Mapbox). Use of those services is governed by their terms and
          privacy policies.
        </p>
        <p className="mb-2">
          <b>Privacy</b>: The app does not intentionally collect PII. Do not
          submit sensitive information. Normal internet risks apply.
        </p>
        <p className="mb-0">
          <b>Contact</b>:{" "}
          <a href="mailto:steve@tarterware.com">steve@tarterware.com</a>
        </p>
      </SectionWrapper>
    );
  }

  return null;
}
