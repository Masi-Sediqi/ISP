export const requiredFieldMessage = "این فیلد ضروری است";

function isEmptyValue(value) {
  if (Array.isArray(value)) return value.length === 0;
  return String(value ?? "").trim() === "";
}

export function validateRequiredFields(values, rules, message = requiredFieldMessage) {
  return rules.reduce((errors, rule) => {
    const field = typeof rule === "string" ? rule : rule.field;
    const required = typeof rule === "object" && "required" in rule ? rule.required : true;
    const invalid =
      typeof rule === "object" && typeof rule.invalid === "function"
        ? rule.invalid(values[field], values)
        : isEmptyValue(values[field]);

    if (required && invalid) {
      errors[field] = typeof rule === "object" && rule.message ? rule.message : message;
    }

    return errors;
  }, {});
}

export function hasFormErrors(errors) {
  return Object.keys(errors || {}).length > 0;
}

export function clearFieldError(errors, field) {
  if (!errors?.[field]) return errors || {};
  const next = { ...errors };
  delete next[field];
  return next;
}
