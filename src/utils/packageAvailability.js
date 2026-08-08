import { todayDateValue } from "./afghanDate";

export function isPackageManuallyAvailable(packageItem) {
  if (!packageItem) return false;

  const manualAvailability = String(
    packageItem.availability || ""
  )
    .trim()
    .toLowerCase();

  if (
    packageItem.isAvailable === false ||
    ["unavailable", "not available", "no", "inactive"].includes(
      manualAvailability
    )
  ) {
    return false;
  }

  return true;
}

export function isPackageAvailable(
  packageItem,
  referenceDate = todayDateValue()
) {
  if (!isPackageManuallyAvailable(packageItem)) return false;

  const endDate = String(packageItem.endDate || "").slice(0, 10);

  if (endDate && referenceDate >= endDate) return false;

  return true;
}

export function packageAvailabilityLabel(packageItem, referenceDate) {
  return isPackageAvailable(packageItem, referenceDate)
    ? "Available"
    : "Not Available";
}
