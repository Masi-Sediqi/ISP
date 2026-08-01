const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { stableStringify } = require("./stableStringify.cjs");

const LICENSE_PREFIX = "AFGPWR1.";
const LICENSE_VERSION = 1;
const PRODUCT_ID = "com.afghanpower.isp";
const SIGNATURE_ALGORITHM = "RSA-SHA256";

function fromBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function getPublicKey() {
  const publicKeyPath = path.join(__dirname, "public-key.pem");
  if (!fs.existsSync(publicKeyPath)) {
    throw new Error("Public license key was not found.");
  }
  return fs.readFileSync(publicKeyPath, "utf8");
}

function decodeLicenseCode(licenseCode) {
  const code = String(licenseCode || "").trim();
  if (!code.startsWith(LICENSE_PREFIX)) {
    return { valid: false, status: "invalid-code" };
  }

  try {
    const raw = fromBase64Url(code.slice(LICENSE_PREFIX.length));
    const certificate = JSON.parse(raw);
    if (!certificate?.payload || typeof certificate.signature !== "string") {
      return { valid: false, status: "invalid-code" };
    }
    return { valid: true, certificate };
  } catch {
    return { valid: false, status: "invalid-code" };
  }
}

function verifySignature(certificate) {
  const verifier = crypto.createVerify(SIGNATURE_ALGORITHM);
  verifier.update(stableStringify(certificate.payload), "utf8");
  verifier.end();
  return verifier.verify(getPublicKey(), certificate.signature, "base64");
}

function normalizeDeviceId(deviceId) {
  return String(deviceId || "").trim().toUpperCase();
}

function validateLicenseCode(licenseCode, expectedDeviceId, now = new Date()) {
  const decoded = decodeLicenseCode(licenseCode);
  if (!decoded.valid) return decoded;

  const { certificate } = decoded;
  const { payload } = certificate;

  if (!verifySignature(certificate)) {
    return { valid: false, status: "invalid-signature" };
  }

  if (payload.productId !== PRODUCT_ID) {
    return { valid: false, status: "wrong-product" };
  }

  if (Number(payload.version) !== LICENSE_VERSION) {
    return { valid: false, status: "unsupported-version" };
  }

  if (payload.status !== "Active") {
    return { valid: false, status: "inactive-license" };
  }

  if (normalizeDeviceId(payload.deviceId) !== normalizeDeviceId(expectedDeviceId)) {
    return { valid: false, status: "device-mismatch" };
  }

  const nowTime = now.getTime();
  const startsAt = new Date(payload.startsAt).getTime();
  if (!Number.isFinite(startsAt)) {
    return { valid: false, status: "invalid-start" };
  }

  if (startsAt > nowTime) {
    return { valid: false, status: "not-started" };
  }

  if (payload.expiresAt !== null) {
    const expiresAt = new Date(payload.expiresAt).getTime();
    if (!Number.isFinite(expiresAt)) {
      return { valid: false, status: "invalid-expiration" };
    }
    if (expiresAt < nowTime) {
      return { valid: false, status: "expired" };
    }
  }

  return {
    valid: true,
    status: "active",
    certificate,
    payload,
  };
}

module.exports = {
  decodeLicenseCode,
  normalizeDeviceId,
  validateLicenseCode,
  verifySignature,
};
