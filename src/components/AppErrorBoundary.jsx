import { Component } from "react";

import "./AppErrorBoundary.css";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidMount() {
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
    if (event?.error) {
      this.setState({ error: event.error });
    }
  };

  handleUnhandledRejection = (event) => {
    this.setState({
      error:
        event?.reason instanceof Error
          ? event.reason
          : new Error(String(event?.reason || "Unexpected loading error")),
    });
  };

  componentDidCatch(error, info) {
    console.error("Application render failed:", error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="app-error-page">
        <div className="app-error-card">
          <div className="app-error-mark">!</div>
          <h1>Afghan Power could not open this page.</h1>
          <p>
            The system hit a loading error. Refresh once, and if it continues,
            check the Supabase connection and account data.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
