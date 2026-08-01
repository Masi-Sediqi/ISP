import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import LicenseGate from "./components/LicenseGate";
import "./App.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <HashRouter>
      <LicenseGate>
        <App />
      </LicenseGate>
    </HashRouter>
  </StrictMode>
);
