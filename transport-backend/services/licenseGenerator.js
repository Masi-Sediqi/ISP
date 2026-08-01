const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { stableStringify } = require("./stableStringify");

const PRODUCT_ID = "com.afghanpower.isp";
const LICENSE_PREFIX = "AFGPWR1.";
const LICENSE_VERSION = 1;
const SIGNATURE_ALGORITHM = "RSA-SHA256";
const MAX_STRING_LENGTH = 512;
const MAX_FEATURES = 50;
const ALLOWED_LICENSE_TYPES = new Set([
  "one-day",
  "three-days",
  "one-week",
  "one-month",
  "one-year",
  "custom",
  "forever",
]);

function assertPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("License request is invalid.");
  }
}

function readString(value, fieldName, { required = false, maxLength = MAX_STRING_LENGTH } = {}) {
  const result = String(value ?? "").trim();
  if (required && !result) throw new Error(`${fieldName} is required.`);
  if (result.length > maxLength) throw new Error(`${fieldName} is too long.`);
  return result;
}

function readDeviceId(value) {
  const deviceId = String(value ?? "").trim().toUpperCase();
  if (!deviceId) throw new Error("Device ID is required.");
  if (deviceId.length > MAX_STRING_LENGTH) throw new Error("Device ID is too long.");
  if (deviceId.startsWith("WEB-")) {
    throw new Error(
      "Browser Device IDs cannot be used for production licenses. Copy the Device ID from the installed Electron customer application."
    );
  }
  return deviceId;
}

function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseDateOnly(value, fieldName) {
  const dateValue = readString(value, fieldName, { required: true, maxLength: 10 });
  if (!isValidDateOnly(dateValue)) throw new Error(`${fieldName} is invalid.`);
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

function calculateEndDate(startDate, licenseType, customEndDate) {
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
      return parseDateOnly(customEndDate, "License end date");
    case "forever":
      return "";
    default:
      throw new Error("License type is invalid.");
  }
}

function buildLicensePeriod(startDateInput, endDateInput, licenseType) {
  const startDate = parseDateOnly(startDateInput, "License start date");
  const endDate = calculateEndDate(startDate, licenseType, endDateInput);

  if (licenseType === "forever") {
    return {
      startDate,
      endDate: "",
      startsAt: `${startDate}T00:00:00.000Z`,
      expiresAt: null,
    };
  }

  if (endDate < startDate) {
    throw new Error("License end date cannot be before the start date.");
  }

  return {
    startDate,
    endDate,
    startsAt: `${startDate}T00:00:00.000Z`,
    expiresAt: `${endDate}T23:59:59.999Z`,
  };
}

function normalizeFeatures(value) {
  if (value === undefined) return ["all"];
  if (!Array.isArray(value) || value.length > MAX_FEATURES) {
    throw new Error("License features are invalid.");
  }
  return value.map((feature) => {
    const normalized = readString(feature, "License feature", { required: true, maxLength: 80 });
    if (!/^[A-Za-z0-9._:-]+$/.test(normalized)) {
      throw new Error("License features are invalid.");
    }
    return normalized;
  });
}

function getPrivateKeyPath() {
  if (process.env.LICENSE_PRIVATE_KEY_PATH) return process.env.LICENSE_PRIVATE_KEY_PATH;
  if (process.env.NODE_ENV === "production") {
    throw new Error("LICENSE_PRIVATE_KEY_PATH is required in production.");
  }

  const developmentFallbacks = [
    path.join(process.cwd(), "secure-keys", "private-key.pem"),
    path.join(process.cwd(), "electron", "license", "private-key.pem"),
  ];

  const found = developmentFallbacks.find((candidate) => fs.existsSync(candidate));
  if (found) return found;
  throw new Error("Private license key was not found.");
}

function getPrivateKey() {
  return fs.readFileSync(getPrivateKeyPath(), "utf8");
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildLicensePayload(input = {}) {
  assertPlainObject(input);
  if (input.status !== undefined && input.status !== "Active") {
    throw new Error("Only active licenses can be generated.");
  }

  const licenseType = readString(input.licenseType || "one-month", "License type", { required: true });
  if (!ALLOWED_LICENSE_TYPES.has(licenseType)) throw new Error("License type is invalid.");

  const period = buildLicensePeriod(input.startDate, input.endDate, licenseType);

  return {
    version: LICENSE_VERSION,
    productId: PRODUCT_ID,
    licenseId: `LIC-${crypto.randomUUID().toUpperCase()}`,
    projectId: readString(input.projectId, "Project ID"),
    projectName: readString(input.projectName, "Project name", { required: true }),
    customerId: readString(input.customerId, "Customer ID"),
    customerName: readString(input.customerName, "Customer name", { required: true }),
    deviceId: readDeviceId(input.deviceId),
    licenseType,
    status: "Active",
    issuedAt: new Date().toISOString(),
    startsAt: period.startsAt,
    expiresAt: period.expiresAt,
    features: normalizeFeatures(input.features),
    nonce: crypto.randomBytes(16).toString("hex"),
  };
}

function createLicenseCode(input = {}) {
  const payload = buildLicensePayload(input);
  const signer = crypto.createSign(SIGNATURE_ALGORITHM);
  signer.update(stableStringify(payload), "utf8");
  signer.end();

  const signature = signer.sign(getPrivateKey(), "base64");
  const certificate = { payload, signature };

  return {
    licenseCode: `${LICENSE_PREFIX}${toBase64Url(JSON.stringify(certificate))}`,
    certificate,
  };
}

module.exports = {
  ALLOWED_LICENSE_TYPES,
  buildLicensePeriod,
  calculateEndDate,
  createLicenseCode,
  LICENSE_PREFIX,
  LICENSE_VERSION,
  PRODUCT_ID,
  SIGNATURE_ALGORITHM,
  stableStringify,
};
