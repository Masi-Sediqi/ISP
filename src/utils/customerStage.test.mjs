import test from "node:test";
import assert from "node:assert/strict";
import {
  customerStageOptions,
  normalizeCustomerStage,
  stageLabel,
} from "./customerStage.js";

test("normalizeCustomerStage defaults empty values to None", () => {
  assert.equal(normalizeCustomerStage(""), "None");
  assert.equal(normalizeCustomerStage(null), "None");
});

test("normalizeCustomerStage preserves known stages", () => {
  assert.equal(normalizeCustomerStage("Embassy Appointment"), "Embassy Appointment");
});

test("stageLabel returns a readable label for unknown stored stages", () => {
  assert.equal(stageLabel("Custom Step"), "Custom Step");
  assert.ok(customerStageOptions.includes("None"));
});
