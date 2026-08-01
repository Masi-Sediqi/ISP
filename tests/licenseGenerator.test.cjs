const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const test = require("node:test");

const privateKeyPath = path.join(__dirname, "..", "electron", "license", "private-key.pem");
process.env.LICENSE_PRIVATE_KEY_PATH = privateKeyPath;

const {
  calculateEndDate,
  buildLicensePeriod,
  createLicenseCode,
  LICENSE_PREFIX,
  SIGNATURE_ALGORITHM,
  stableStringify,
} = require("../transport-backend/services/licenseGenerator.js");
const {
  validateLicenseCode,
} = require("../electron/license/licenseValidator.cjs");
const { startServer } = require("../transport-backend/server");

const privateKey = fs.readFileSync(privateKeyPath, "utf8");
const publicKey = crypto.createPublicKey(privateKey);

function baseRequest(overrides = {}) {
  return {
    projectId: "project-1",
    projectName: "ISP management system",
    customerId: "customer-1",
    customerName: "Rahman",
    deviceId: " pc-01-hdd-abc123 ",
    licenseType: "one-month",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    status: "Active",
    features: ["all"],
    ...overrides,
  };
}

function verifyCertificate(certificate) {
  const verifier = crypto.createVerify(SIGNATURE_ALGORITHM);
  verifier.update(stableStringify(certificate.payload), "utf8");
  verifier.end();
  return verifier.verify(publicKey, certificate.signature, "base64");
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function tamperedLicenseCode(certificate, patchPayload) {
  const patched = {
    payload: {
      ...certificate.payload,
      ...patchPayload,
    },
    signature: certificate.signature,
  };
  return `${LICENSE_PREFIX}${toBase64Url(JSON.stringify(patched))}`;
}

async function postJson(url, body, sessionId) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionId ? { "X-ISP-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

test("calendar license end dates are calculated exactly", () => {
  assert.equal(calculateEndDate("2026-08-01", "one-day"), "2026-08-01");
  assert.equal(calculateEndDate("2026-08-01", "three-days"), "2026-08-03");
  assert.equal(calculateEndDate("2026-08-01", "one-week"), "2026-08-07");
  assert.equal(calculateEndDate("2026-08-01", "one-month"), "2026-08-31");
  assert.equal(calculateEndDate("2026-01-31", "one-month"), "2026-02-27");
  assert.equal(calculateEndDate("2026-08-01", "one-year"), "2027-07-31");
  assert.equal(calculateEndDate("2024-02-29", "one-year"), "2025-02-27");
  assert.equal(calculateEndDate("2026-08-01", "custom", "2026-09-15"), "2026-09-15");
  assert.equal(calculateEndDate("2026-08-01", "forever"), "");
});

test("buildLicensePeriod returns signed UTC day boundaries", () => {
  assert.deepEqual(buildLicensePeriod("2026-08-01", "", "one-day"), {
    startDate: "2026-08-01",
    endDate: "2026-08-01",
    startsAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-08-01T23:59:59.999Z",
  });

  assert.deepEqual(buildLicensePeriod("2026-08-01", "", "three-days"), {
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    startsAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-08-03T23:59:59.999Z",
  });

  assert.deepEqual(buildLicensePeriod("2026-08-01", "", "one-week"), {
    startDate: "2026-08-01",
    endDate: "2026-08-07",
    startsAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-08-07T23:59:59.999Z",
  });
});

test("generated payload dates match the selected license type", () => {
  const oneDay = createLicenseCode(baseRequest({ licenseType: "one-day", endDate: "2026-08-01" }));
  assert.equal(oneDay.certificate.payload.startsAt, "2026-08-01T00:00:00.000Z");
  assert.equal(oneDay.certificate.payload.expiresAt, "2026-08-01T23:59:59.999Z");

  const forever = createLicenseCode(baseRequest({ licenseType: "forever", endDate: "" }));
  assert.equal(forever.certificate.payload.expiresAt, null);

  const month = createLicenseCode(baseRequest({ licenseType: "one-month", startDate: "2026-08-01", endDate: "2026-08-31" }));
  assert.equal(month.certificate.payload.startsAt, "2026-08-01T00:00:00.000Z");
  assert.equal(month.certificate.payload.expiresAt, "2026-08-31T23:59:59.999Z");
});

test("invalid input is rejected", () => {
  assert.throws(() => createLicenseCode(baseRequest({ licenseType: "custom", endDate: "2026-07-31" })), /before the start date/);
  assert.throws(() => createLicenseCode(baseRequest({ deviceId: "WEB-123" })), /Browser Device IDs/);
  assert.throws(() => createLicenseCode(baseRequest({ deviceId: " " })), /Device ID is required/);
  assert.throws(() => createLicenseCode(baseRequest({ licenseType: "trial" })), /License type is invalid/);
  assert.throws(() => createLicenseCode(baseRequest({ status: "Suspended" })), /Only active/);
  assert.throws(() => createLicenseCode(baseRequest({ status: "Revoked" })), /Only active/);
});

test("signature verifies and device id is normalized only by trim and uppercase", () => {
  const result = createLicenseCode(baseRequest({ deviceId: " pc 01 / abc " }));
  assert.equal(result.certificate.payload.deviceId, "PC 01 / ABC");
  assert.equal(verifyCertificate(result.certificate), true);
});

test("same device renewal creates a new valid license id and nonce", () => {
  const first = createLicenseCode(baseRequest());
  const second = createLicenseCode(baseRequest());

  assert.notEqual(first.certificate.payload.licenseId, second.certificate.payload.licenseId);
  assert.notEqual(first.certificate.payload.nonce, second.certificate.payload.nonce);
  assert.equal(verifyCertificate(first.certificate), true);
  assert.equal(verifyCertificate(second.certificate), true);
});

test("customer validator accepts matching device and rejects mismatch", () => {
  const result = createLicenseCode(baseRequest({ deviceId: "C299-9461-ED51-930B-E2E8-99F0-2B94-F4C6" }));
  const matching = validateLicenseCode(result.licenseCode, "c299-9461-ed51-930b-e2e8-99f0-2b94-f4c6", new Date("2026-08-02T12:00:00.000Z"));
  const mismatch = validateLicenseCode(result.licenseCode, "OTHER-DEVICE", new Date("2026-08-02T12:00:00.000Z"));

  assert.equal(matching.valid, true);
  assert.equal(matching.payload.deviceId, "C299-9461-ED51-930B-E2E8-99F0-2B94-F4C6");
  assert.equal(mismatch.valid, false);
  assert.equal(mismatch.status, "device-mismatch");
});

test("customer validator rejects modified and expired codes", () => {
  const valid = createLicenseCode(baseRequest({
    licenseType: "custom",
    startDate: "2026-08-01",
    endDate: "2026-08-01",
    deviceId: "DEVICE-1",
  }));
  const tampered = validateLicenseCode(
    tamperedLicenseCode(valid.certificate, { projectName: "Changed project" }),
    "DEVICE-1",
    new Date("2026-08-01T12:00:00.000Z")
  );
  const expired = validateLicenseCode(valid.licenseCode, "DEVICE-1", new Date("2026-08-02T00:00:00.000Z"));

  assert.equal(tampered.valid, false);
  assert.equal(tampered.status, "invalid-signature");
  assert.equal(expired.valid, false);
  assert.equal(expired.status, "expired");
});

test("backend license route requires admin and generates audited licenses", async (t) => {
  const dataDir = await fsp.mkdtemp(path.join(os.tmpdir(), "isp-license-test-"));
  await fsp.writeFile(
    path.join(dataDir, "accounts.json"),
    JSON.stringify([
      { id: "admin-1", role: "Admin", fullName: "Admin User", status: "Active" },
      { id: "user-1", role: "User", fullName: "Normal User", status: "Active" },
    ])
  );

  const started = await startServer({ host: "127.0.0.1", port: 0, dataDir });
  t.after(() => started.server.close());
  const url = `http://127.0.0.1:${started.port}/api/license/generate`;

  const unauthenticated = await postJson(url, baseRequest(), "");
  assert.equal(unauthenticated.status, 401);

  const nonAdmin = await postJson(url, baseRequest(), "user-1");
  assert.equal(nonAdmin.status, 403);

  const webDevice = await postJson(url, baseRequest({ deviceId: "WEB-123" }), "admin-1");
  assert.equal(webDevice.status, 400);
  assert.match(webDevice.body.error, /Browser Device IDs/);

  const admin = await postJson(url, baseRequest({ deviceId: "API-DEVICE-1" }), "admin-1");
  assert.equal(admin.status, 200);
  assert.equal(admin.body.success, true);
  assert.equal(verifyCertificate(admin.body.certificate), true);

  const auditRows = JSON.parse(await fsp.readFile(path.join(dataDir, "licenseGenerationAudit.json"), "utf8"));
  assert.equal(auditRows.length, 1);
  assert.equal(auditRows[0].generatedBy, "admin-1");
  assert.equal(auditRows[0].deviceId, "API-DEVICE-1");
});
