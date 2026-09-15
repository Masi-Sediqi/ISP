export const DEFAULT_EXCHANGE_RATES = Object.freeze({
  usdToAfn: 0,
  eurToAfn: 0,
});

export function normalizeExchangeRates(value = {}) {
  const usdToAfn = Number(value?.usdToAfn || 0);
  const eurToAfn = Number(value?.eurToAfn || 0);

  return {
    usdToAfn: Number.isFinite(usdToAfn) && usdToAfn > 0 ? usdToAfn : 0,
    eurToAfn: Number.isFinite(eurToAfn) && eurToAfn > 0 ? eurToAfn : 0,
  };
}

export function normalizeCurrency(value) {
  const code = String(value || "AFN").trim().toUpperCase();
  if (code === "USD" || code === "$" || code.includes("DOLLAR")) return "USD";
  if (code === "EUR" || code === "€" || code.includes("EURO")) return "EUR";
  return "AFN";
}

export function convertToBaseAfn(amount, currency = "AFN", rates = DEFAULT_EXCHANGE_RATES) {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount)) return 0;

  const code = normalizeCurrency(currency);
  const normalizedRates = normalizeExchangeRates(rates);

  if (code === "USD") {
    return normalizedRates.usdToAfn > 0 ? numericAmount * normalizedRates.usdToAfn : numericAmount;
  }

  if (code === "EUR") {
    return normalizedRates.eurToAfn > 0 ? numericAmount * normalizedRates.eurToAfn : numericAmount;
  }

  return numericAmount;
}

export function hasRequiredExchangeRate(currency, rates = DEFAULT_EXCHANGE_RATES) {
  const code = normalizeCurrency(currency);
  const normalizedRates = normalizeExchangeRates(rates);
  if (code === "USD") return normalizedRates.usdToAfn > 0;
  if (code === "EUR") return normalizedRates.eurToAfn > 0;
  return true;
}
