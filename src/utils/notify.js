function appTitle() {
  return "Afghan Power";
}

function canUseWebNotification() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    typeof window.Notification === "function"
  );
}

export async function requestSystemNotificationPermission() {
  if (window.ispDesktop?.isDesktop) return "granted";
  if (!canUseWebNotification()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;

  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export async function notifySystem(title, body, options = {}) {
  const cleanBody = String(body || "").trim();
  if (!cleanBody) return;

  if (window.ispDesktop?.showNotification) {
    try {
      await window.ispDesktop.showNotification({
        title: title || appTitle(),
        body: cleanBody,
        path: options.path || "",
        silent: options.silent === true,
      });
      return;
    } catch {
      // Fall through to Web Notifications if the desktop bridge is unavailable.
    }
  }

  if (!canUseWebNotification()) return;

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await requestSystemNotificationPermission();

  if (permission !== "granted") return;

  const notification = new Notification(title || appTitle(), {
    body: cleanBody,
    silent: options.silent === true,
  });

  if (options.path) {
    notification.onclick = () => {
      window.focus();
      window.location.hash = `#${options.path}`;
      notification.close();
    };
  }
}

export function notify(message, type = "success", options = {}) {
  window.dispatchEvent(new CustomEvent("app-notification", {
    detail: { id: Date.now(), message, type },
  }));

  if (options.system === true) {
    notifySystem(
      options.title || appTitle(),
      options.body || message,
      options
    );
  }
}
