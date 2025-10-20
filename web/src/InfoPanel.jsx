import React from "react";
import { Container, Card } from "react-bootstrap";

export default function InfoPanel({ activeSection }) {
  if (!activeSection) return null;

  const SectionWrapper = ({ title, children }) => (
    <Container className="py-4">
      <Card className="mb-4">
        <Card.Body>
          <h4>{title}</h4>
          <div>{children}</div>
        </Card.Body>
      </Card>
    </Container>
  );

  if (activeSection === "directions") {
    return (
      <SectionWrapper title="Directions">
        <ol>
          <li>Select origin and destination of a route.</li>
          <li>Submit it using the form.</li>
          <li>
            In seconds, receive an accident risk score for the route under the current weather and lighting conditions.
          </li>
        </ol>
      </SectionWrapper>
    );
  }

  if (activeSection === "about") {
    return (
      <SectionWrapper title="About">
        This app is the web client interface for the Road Risk Playground application.
        It enables users to select a route on a map and assess the risk of accident on that
        road under current conditions.  It uses Mapbox to retrieve the route, which it uses
        to determine road curvature, urban/rural, road type, and other qualities.  It uses the
        current date augmented with sunrise/sunset times for the route location to determine
        the lighting quality.
        The application frontend and backend are hosted
        on Amazon Web Services.
      </SectionWrapper>
    );
  }

  if (activeSection === "legal") {
    return (
      <SectionWrapper title="Legal">
        <b>No Warranty or Guarantee</b><br />
        This application is provided “as is” for educational and demonstration purposes.
        While we strive for accuracy, no guarantee is made regarding the correctness of
        predictions or the uninterrupted availability of the service. Users should not rely
        on this tool for any critical or production use.<br /><br />

        <b>Limitation of Liability</b><br />
        Under no circumstances shall the developer be liable for any direct, indirect,
        incidental, or consequential damages resulting from the use or inability to use
        the application.<br /><br />

        <b>Third-Party Services</b><br />
        This application may interact with third-party services or APIs (e.g., AWS). These
        services operate under their own terms of service and privacy policies. We encourage
        users to review those separately.<br /><br />

        <b>Privacy and Security</b><br />
        We do not collect personally identifiable information. However, all data
        transmissions are subject to standard internet security risks. Users should
        avoid submitting sensitive or personal data through the platform.<br /><br />

        <b>Contact</b><br />
        For questions or concerns about this legal policy, please contact&nbsp;
        <a href="mailto:steve@tarterware.com">steve@tarterware.com</a>.
      </SectionWrapper>
    );
  }

  return null;
}
