export const CASH_WALLET_CURRENCIES = ["AFN", "USD", "EUR"];

export function normalizeWalletCurrency(value) {
  const code = String(value || "AFN").trim().toUpperCase();
  return CASH_WALLET_CURRENCIES.includes(code) ? code : "AFN";
}

export function calculateCashWalletBalances(records) {
  const balances = { AFN: 0, USD: 0, EUR: 0 };

  for (const record of Array.isArray(records) ? records : []) {
    const amount = Number(record?.amount || 0);
    if (!Number.isFinite(amount)) continue;

    const currency = normalizeWalletCurrency(record?.currency);
    const type = String(record?.type || "").trim().toLowerCase();

    if (type === "deposit") balances[currency] += amount;
    if (type === "credit") balances[currency] -= amount;
  }

  return balances;
}

export function calculateCashWalletBalance(records, currency = "AFN") {
  const balances = calculateCashWalletBalances(records);
  return balances[normalizeWalletCurrency(currency)] || 0;
}

export function formatWalletAmount(amount, currency) {
  const value = Number(amount || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
  const code = normalizeWalletCurrency(currency);
  if (code === "USD") return `$${value}`;
  if (code === "EUR") return `€${value}`;
  return `${value} ؋`;
}

export function availableCashWalletBalanceForCurrency(
  records,
  currency = "AFN",
  previousTransaction = null
) {
  const selectedCurrency = normalizeWalletCurrency(currency);
  let available = calculateCashWalletBalance(records, selectedCurrency);

  if (
    previousTransaction &&
    String(previousTransaction.type || "").trim().toLowerCase() === "credit" &&
    normalizeWalletCurrency(previousTransaction.currency) === selectedCurrency
  ) {
    const previousAmount = Number(previousTransaction.amount || 0);
    if (Number.isFinite(previousAmount)) available += previousAmount;
  }

  return available;
}
