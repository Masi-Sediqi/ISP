export const DISPLAY_CURRENCIES = ['AFN', 'USD', 'EUR'];

export function normalizeDisplayCurrency(value) {
  const code = String(value || 'AFN').trim().toUpperCase();
  if (code === 'USD' || code === '$' || code.includes('DOLLAR')) return 'USD';
  if (code === 'EUR' || code === '€' || code.includes('EURO')) return 'EUR';
  return code || 'AFN';
}

export function formatCurrencyAmount(amount, currency = 'AFN', options = {}) {
  const numeric = Number(amount || 0);
  const value = Number.isFinite(numeric) ? numeric : 0;
  const sign = value < 0 ? '-' : '';
  const formatted = Math.abs(value).toLocaleString('en-US', {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  });
  const code = normalizeDisplayCurrency(currency);
  if (code === 'USD') return `${sign}$${formatted}`;
  if (code === 'EUR') return `${sign}€${formatted}`;
  if (code === 'AFN') return `${sign}${formatted} ؋`;
  return `${sign}${formatted} ${code}`;
}

export function sumCurrencyAmounts(records, amountGetter = (item) => item?.amount, currencyGetter = (item) => item?.currency || item?.unit) {
  const totals = { AFN: 0, USD: 0, EUR: 0 };
  for (const item of Array.isArray(records) ? records : []) {
    const amount = Number(amountGetter(item) || 0);
    if (!Number.isFinite(amount)) continue;
    const currency = normalizeDisplayCurrency(currencyGetter(item));
    if (!(currency in totals)) totals[currency] = 0;
    totals[currency] += amount;
  }
  return totals;
}

export function mergeCurrencyTotals(...totalsList) {
  return totalsList.reduce((result, totals) => {
    for (const currency of DISPLAY_CURRENCIES) {
      result[currency] += Number(totals?.[currency] || 0);
    }
    return result;
  }, { AFN: 0, USD: 0, EUR: 0 });
}

export function subtractCurrencyTotals(left = {}, right = {}) {
  return DISPLAY_CURRENCIES.reduce((result, currency) => {
    result[currency] = Number(left?.[currency] || 0) - Number(right?.[currency] || 0);
    return result;
  }, {});
}

export function formatCurrencyTotals(totals = {}, options = {}) {
  const includeZero = Boolean(options.includeZero);
  const parts = DISPLAY_CURRENCIES
    .filter((currency) => includeZero || Math.abs(Number(totals?.[currency] || 0)) > 0)
    .map((currency) => formatCurrencyAmount(totals?.[currency] || 0, currency, options));
  return parts.length ? parts.join('  ·  ') : formatCurrencyAmount(0, options.fallbackCurrency || 'AFN', options);
}
