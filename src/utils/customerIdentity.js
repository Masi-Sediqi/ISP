function customerNameOf(customer) {
  return (
    customer?.fullName ||
    customer?.passportFullName ||
    customer?.customerName ||
    customer?.personName ||
    customer?.name ||
    ""
  );
}

function customerPhoneOf(customer) {
  return customer?.phone || customer?.customerPhone || customer?.phoneNumber || "";
}

export function normalizeCustomerName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function normalizeCustomerPhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return hasPlus && digits ? `+${digits}` : digits;
}

export function isSameCustomerIdentity(a, b) {
  const aName = normalizeCustomerName(customerNameOf(a));
  const bName = normalizeCustomerName(customerNameOf(b));
  const aPhone = normalizeCustomerPhone(customerPhoneOf(a));
  const bPhone = normalizeCustomerPhone(customerPhoneOf(b));

  return Boolean(aName && bName && aPhone && bPhone && aName === bName && aPhone === bPhone);
}

export function findDuplicateCustomer(customers, candidate, excludeId = null) {
  return (
    (customers || []).find((customer) => {
      if (excludeId != null && String(customer?.id || customer?.customerId || "") === String(excludeId)) {
        return false;
      }
      return isSameCustomerIdentity(customer, candidate);
    }) || null
  );
}
