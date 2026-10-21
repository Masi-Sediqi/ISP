import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./App.css";
import "./retail-ui.css";
import "./dark-mode-fixes.css";
import "./isp-theme-fixes.css";
import "./isp-final-ui.css";
import "./isp-global-ui-fix.css";
import "./isp-search-border-fix.css";
import "./isp-targeted-final.css";
import "./isp-mobile-responsive.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode><AppErrorBoundary><HashRouter><App /></HashRouter></AppErrorBoundary></StrictMode>
);
