import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/newsreader";
import { PortalApp } from "./app/PortalApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PortalApp />
  </StrictMode>,
);
