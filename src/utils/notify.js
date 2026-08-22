const NOTIFICATION_SETTINGS_KEY = "afghan-power-notification-settings";

function appTitle() {
  return "Afghan Power";
}

function readNotificationSettings() {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      enabled: parsed.enabled !== false,
      hiddenMessages: Array.isArray(parsed.hiddenMessages) ? parsed.hiddenMessages : [],
    };
  } catch {
    return { enabled: true, hiddenMessages: [] };
  }
}

export function getNotificationSettings() {
  if (typeof window === "undefined") {
    return { enabled: true, hiddenMessages: [] };
  }
  return readNotificationSettings();
}

export function setNotificationsEnabled(enabled) {
  if (typeof window === "undefined") return;
  const current = readNotificationSettings();
  const next = { ...current, enabled: Boolean(enabled) };
  window.localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("app-notification-settings-changed", { detail: next }));
}

export function hideNotificationMessage(message) {
  if (typeof window === "undefined") return;
  const cleanMessage = String(message || "").trim();
  if (!cleanMessage) return;
  const current = readNotificationSettings();
  const hiddenMessages = Array.from(new Set([...current.hiddenMessages, cleanMessage])).slice(-200);
  const next = { ...current, hiddenMessages };
  window.localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("app-notification-settings-changed", { detail: next }));
}

export function resetHiddenNotifications() {
  if (typeof window === "undefined") return;
  const current = readNotificationSettings();
  const next = { ...current, hiddenMessages: [] };
  window.localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("app-notification-settings-changed", { detail: next }));
}

function shouldShowNotification(message) {
  const settings = getNotificationSettings();
  const cleanMessage = String(message || "").trim();
  return settings.enabled && !settings.hiddenMessages.includes(cleanMessage);
}

function canUseWebNotification() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    typeof window.Notification === "function"
  );
}

export async function requestSystemNotificationPermission() {
  if (!getNotificationSettings().enabled) return "disabled";
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
  if (!cleanBody || !shouldShowNotification(cleanBody)) return;

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

  // Native notifications must not remain indefinitely either.
  window.setTimeout(() => notification.close(), Math.max(4000, Number(options.duration) || 4000));

  if (options.path) {
    notification.onclick = () => {
      window.focus();
      window.location.hash = `#${options.path}`;
      notification.close();
    };
  }
}

let notificationSequence = 0;

export function notify(message, type = "success", options = {}) {
  const cleanMessage = String(message || "").trim();
  if (!cleanMessage || !shouldShowNotification(cleanMessage)) return;

  notificationSequence += 1;
  window.dispatchEvent(new CustomEvent("app-notification", {
    detail: {
      id: `${Date.now()}-${notificationSequence}`,
      message: cleanMessage,
      type,
      duration: Math.max(4000, Number(options.duration) || 4000),
    },
  }));

  if (options.system === true) {
    notifySystem(
      options.title || appTitle(),
      options.body || cleanMessage,
      options
    );
  }
}
