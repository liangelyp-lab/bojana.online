import "./polyfill";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { PageBoundary } from "./components/ui/System";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageBoundary>
      <App />
    </PageBoundary>
  </StrictMode>,
);
