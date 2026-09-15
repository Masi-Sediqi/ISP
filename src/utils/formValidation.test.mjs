import test from "node:test";
import assert from "node:assert/strict";
import {
  clearFieldError,
  hasFormErrors,
  requiredFieldMessage,
  validateRequiredFields,
} from "./formValidation.js";

test("validateRequiredFields returns the default message for empty required fields", () => {
  const errors = validateRequiredFields(
    {
      fullName: "   ",
      departments: [],
      phone: "0799000000",
    },
    ["fullName", "departments", "phone"]
  );

  assert.equal(errors.fullName, requiredFieldMessage);
  assert.equal(errors.departments, requiredFieldMessage);
  assert.equal(errors.phone, undefined);
  assert.equal(hasFormErrors(errors), true);
});

test("validateRequiredFields supports optional and custom invalid rules", () => {
  const errors = validateRequiredFields(
    {
      projectName: "Smart Office",
      fixedSalary: "0",
      notes: "",
    },
    [
      "projectName",
      { field: "fixedSalary", invalid: (value) => Number(value || 0) <= 0 },
      { field: "notes", required: false },
    ]
  );

  assert.deepEqual(errors, { fixedSalary: requiredFieldMessage });
});

test("clearFieldError removes only the requested field", () => {
  assert.deepEqual(clearFieldError({ fullName: "x", phone: "y" }, "phone"), {
    fullName: "x",
  });
});
