import assert from "node:assert/strict";
import test from "node:test";
import { isRecoverableRuntimeError } from "./runtimeErrors.js";

test("isRecoverableRuntimeError treats network and VPS failures as non-fatal", () => {
  assert.equal(isRecoverableRuntimeError(new TypeError("Failed to fetch")), true);
  assert.equal(isRecoverableRuntimeError(new Error("Network Error")), true);
  assert.equal(isRecoverableRuntimeError(new Error("Unable to load customers from VPS server.")), true);
});

test("isRecoverableRuntimeError keeps render and programming errors fatal", () => {
  assert.equal(isRecoverableRuntimeError(new Error("Cannot read properties of undefined")), false);
  assert.equal(isRecoverableRuntimeError(new ReferenceError("missingValue is not defined")), false);
});
