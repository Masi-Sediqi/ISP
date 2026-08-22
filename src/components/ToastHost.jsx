import { useEffect, useRef, useState } from "react";
import {
  getNotificationSettings,
  hideNotificationMessage,
  setNotificationsEnabled,
} from "../utils/notify";

function ToastHost() {
  const [messages, setMessages] = useState([]);
  const timersRef = useRef(new Map());

  const removeMessage = (id) => {
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
    setMessages((current) => current.filter((item) => item.id !== id));
  };

  useEffect(() => {
    const timers = timersRef.current;

    const showMessage = (event) => {
      const message = event.detail;
      if (!message?.id || !message?.message || !getNotificationSettings().enabled) return;

      setMessages((current) => [...current, message]);
      const timer = window.setTimeout(() => {
        setMessages((current) => current.filter((item) => item.id !== message.id));
        timers.delete(message.id);
      }, Math.max(4000, Number(message.duration) || 4000));
      timers.set(message.id, timer);
    };

    const handleSettingsChanged = (event) => {
      if (event.detail?.enabled === false) {
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.clear();
        setMessages([]);
      }
    };

    window.addEventListener("app-notification", showMessage);
    window.addEventListener("app-notification-settings-changed", handleSettingsChanged);
    return () => {
      window.removeEventListener("app-notification", showMessage);
      window.removeEventListener("app-notification-settings-changed", handleSettingsChanged);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const turnOffNotifications = () => {
    setNotificationsEnabled(false);
  };

  const doNotShowAgain = (message) => {
    hideNotificationMessage(message.message);
    removeMessage(message.id);
  };

  return (
    <div className="toast-host" aria-live="polite">
      {messages.map((message) => (
        <div key={message.id} className={`app-toast ${message.type}`} role="status">
          <span className="app-toast-icon" aria-hidden="true">
            {message.type === "error" ? "!" : message.type === "warning" ? "!" : "✓"}
          </span>
          <div className="app-toast-body">
            <p>{message.message}</p>
            <div className="app-toast-actions">
              <button type="button" onClick={() => removeMessage(message.id)}>Close</button>
              <button type="button" onClick={() => doNotShowAgain(message)}>Do not Show Notification</button>
              <button type="button" className="danger" onClick={turnOffNotifications}>Turn Off Notification</button>
            </div>
          </div>
          <button
            type="button"
            className="app-toast-close"
            aria-label="Close notification"
            title="Close"
            onClick={() => removeMessage(message.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastHost;
