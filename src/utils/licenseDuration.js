export const allowedLicenseTypes = new Set([
  "one-day",
  "three-days",
  "one-week",
  "one-month",
  "one-year",
  "custom",
  "forever",
]);

function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseDateOnly(value, fieldName) {
  const dateValue = String(value || "").trim();
  if (!isValidDateOnly(dateValue)) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return dateValue;
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysInUtcMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addCalendarMonths(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  const sourceDay = date.getUTCDate();
  const targetMonthIndex = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const safeDay = Math.min(sourceDay, daysInUtcMonth(targetYear, normalizedMonth));
  return new Date(Date.UTC(targetYear, normalizedMonth, safeDay)).toISOString().slice(0, 10);
}

export function calculateLicenseEndDate(startDate, licenseType, customEndDate = "") {
  if (!startDate && licenseType !== "forever") return "";
  if (licenseType === "forever") return "";

  const start = parseDateOnly(startDate, "License start date");

  switch (licenseType) {
    case "one-day":
      return start;
    case "three-days":
      return addDays(start, 2);
    case "one-week":
      return addDays(start, 6);
    case "one-month":
      return addDays(addCalendarMonths(start, 1), -1);
    case "one-year":
      return addDays(addCalendarMonths(start, 12), -1);
    case "custom":
      return customEndDate ? parseDateOnly(customEndDate, "License end date") : "";
    default:
      throw new Error("License type is invalid.");
  }
}

export function buildLicensePeriod(startDate, endDate, licenseType) {
  if (!allowedLicenseTypes.has(licenseType)) {
    throw new Error("License type is invalid.");
  }

  const start = parseDateOnly(startDate, "License start date");
  const calculatedEndDate = calculateLicenseEndDate(start, licenseType, endDate);
  const startsAt = `${start}T00:00:00.000Z`;
  const expiresAt = licenseType === "forever" ? null : `${calculatedEndDate}T23:59:59.999Z`;

  if (expiresAt && new Date(expiresAt).getTime() < new Date(startsAt).getTime()) {
    throw new Error("License end date cannot be before the start date.");
  }

  return {
    startDate: start,
    endDate: calculatedEndDate,
    startsAt,
    expiresAt,
  };
}
