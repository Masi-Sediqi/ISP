export function shouldStartSubmitBusy({ hasValidationErrors, formConnected, notificationAgeMs }) {
  if (!formConnected) return false;
  if (hasValidationErrors) return false;
  if (Number(notificationAgeMs) < 150) return false;
  return true;
}
