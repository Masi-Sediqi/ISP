import { Component } from "react";
import { runtimeErrorMessage } from "../utils/runtimeErrors";

import "./AppErrorBoundary.css";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Only React render/lifecycle errors should replace the application UI.
    return { error };
  }

  componentDidMount() {
    // Background browser/runtime errors must not blank the whole application.
    // They are still logged so they can be diagnosed from DevTools.
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection
    );
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection
    );
  }

  handleWindowError = (event) => {
    const error = event?.error || event?.message;
    console.error("[Background window error]", error);
  };

  handleUnhandledRejection = (event) => {
    console.error("[Background promise rejection]", event?.reason);
  };

  componentDidCatch(error, info) {
    console.error("Application render failed:", error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const detail = runtimeErrorMessage(this.state.error);

    return (
      <div className="app-error-page">
        <div className="app-error-card">
          <div className="app-error-mark">!</div>
          <h1>Afghan Power could not open this page.</h1>
          <p>
            A page rendering error occurred. Refresh once. If it continues,
            check the technical message below.
          </p>
          {detail && (
            <small className="app-error-detail">
              {detail}
            </small>
          )}
          <button type="button" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
