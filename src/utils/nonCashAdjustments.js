// A balance write-off changes staff liabilities, not cash flow or profit.
// Keep it in employeeAdjustments for ledger/audit purposes but exclude it
// from Finance transactions, income, expenses and Dashboard financial metrics.
export function isNonCashStaffBalanceAdjustment(entry) {
  if (!entry || typeof entry !== 'object') return false;
  const adjustmentType = String(entry.adjustmentType || entry.type || '').toLowerCase();
  const source = String(entry.source || '').toLowerCase();
  return adjustmentType === 'balance_writeoff' || source === 'staff-payable-balance-adjustment' ||
    (source === 'employee-adjustment' && adjustmentType === 'balance_writeoff');
}
