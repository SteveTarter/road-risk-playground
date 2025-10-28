import React from "react";
import { Card } from "react-bootstrap";

export default function InfoPanel({ activeSection }) {
  if (!activeSection) return null;

  const SectionWrapper = ({ title, children }) => (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title as="h5">{title}</Card.Title>
        <div>{children}</div>
      </Card.Body>
    </Card>
  );

  if (activeSection === "directions") {
    return (
      <SectionWrapper title="Directions">
        <ol className="mb-0">
          <li>Select origin and destination of a route.</li>
          <li>Submit it using the form.</li>
          <li>Receive a risk score based on current conditions.</li>
        </ol>
      </SectionWrapper>
    );
  }

  if (activeSection === "about") {
    return (
      <SectionWrapper title="About">
        This client lets you pick a route and assess accident risk. It uses Mapbox
        for routing and derives features like curvature, urban/rural, and road class.
        Lighting is computed from date and route location (sunrise/sunset).
        Frontend and backend run on AWS.
      </SectionWrapper>
    );
  }

  if (activeSection === "legal") {
    return (
      <SectionWrapper title="Legal">
        <b>No Warranty or Guarantee</b><br />
        Provided “as is” for educational/demo purposes. No guarantee of correctness
        or availability.<br /><br />
        <b>Limitation of Liability</b><br />
        No liability for direct/indirect damages from use or inability to use.<br /><br />
        <b>Third-Party Services</b><br />
        May interact with third-party APIs under their own terms and policies.<br /><br />
        <b>Privacy and Security</b><br />
        No PII collection. Standard internet risks apply. Don’t submit sensitive data.<br /><br />
        <b>Contact</b><br />
        <a href="mailto:steve@tarterware.com">steve@tarterware.com</a>
      </SectionWrapper>
    );
  }

  return null;
}
